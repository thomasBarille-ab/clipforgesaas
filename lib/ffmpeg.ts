/**
 * FFmpeg WASM loader.
 *
 * Le worker @ffmpeg/ffmpeg a des imports relatifs (./const.js, ./errors.js)
 * qui ne fonctionnent pas depuis un blob URL.
 * Solution : on inline tout le code du worker dans un seul blob.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

let ffmpegReady: Promise<{ ffmpeg: any; fetchFile: any }> | null = null

const dynamicImport = new Function('specifier', 'return import(specifier)')

/**
 * Construit le code du worker inline (const.js + errors.js + worker.js fusionnés)
 * en remplaçant les imports relatifs.
 */
function buildInlineWorkerCode(): string {
  return `
// === const.js (inlined) ===
const CORE_URL = "${CORE_BASE}/ffmpeg-core.js";
const FFMessageType = {
  LOAD: "LOAD", EXEC: "EXEC", FFPROBE: "FFPROBE",
  WRITE_FILE: "WRITE_FILE", READ_FILE: "READ_FILE", DELETE_FILE: "DELETE_FILE",
  RENAME: "RENAME", CREATE_DIR: "CREATE_DIR", LIST_DIR: "LIST_DIR",
  DELETE_DIR: "DELETE_DIR", ERROR: "ERROR", DOWNLOAD: "DOWNLOAD",
  PROGRESS: "PROGRESS", LOG: "LOG", MOUNT: "MOUNT", UNMOUNT: "UNMOUNT",
};

// === errors.js (inlined) ===
const ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
const ERROR_NOT_LOADED = new Error("ffmpeg is not loaded, call \`await ffmpeg.load()\` first");
const ERROR_IMPORT_FAILURE = new Error("failed to import ffmpeg-core.js");

// === worker.js (inlined, imports removed) ===
let ffmpeg;

const load = async ({ coreURL: _coreURL, wasmURL: _wasmURL, workerURL: _workerURL }) => {
  const first = !ffmpeg;
  try {
    if (!_coreURL) _coreURL = CORE_URL;
    importScripts(_coreURL);
  } catch {
    if (!_coreURL || _coreURL === CORE_URL) _coreURL = CORE_URL;
    self.createFFmpegCore = (await import(_coreURL)).default;
    if (!self.createFFmpegCore) throw ERROR_IMPORT_FAILURE;
  }
  const coreURL = _coreURL;
  const wasmURL = _wasmURL ? _wasmURL : _coreURL.replace(/.js$/g, ".wasm");
  const workerURL = _workerURL ? _workerURL : _coreURL.replace(/.js$/g, ".worker.js");
  ffmpeg = await self.createFFmpegCore({
    mainScriptUrlOrBlob: coreURL + "#" + btoa(JSON.stringify({ wasmURL, workerURL })),
  });
  ffmpeg.setLogger((data) => self.postMessage({ type: FFMessageType.LOG, data }));
  ffmpeg.setProgress((data) => self.postMessage({ type: FFMessageType.PROGRESS, data }));
  return first;
};

const exec = ({ args, timeout = -1 }) => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const ffprobe = ({ args, timeout = -1 }) => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.ffprobe(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const writeFile = ({ path, data }) => { ffmpeg.FS.writeFile(path, data); return true; };
const readFile = ({ path, encoding }) => ffmpeg.FS.readFile(path, { encoding });
const deleteFile = ({ path }) => { ffmpeg.FS.unlink(path); return true; };
const rename = ({ oldPath, newPath }) => { ffmpeg.FS.rename(oldPath, newPath); return true; };
const createDir = ({ path }) => { ffmpeg.FS.mkdir(path); return true; };
const listDir = ({ path }) => {
  const names = ffmpeg.FS.readdir(path);
  const nodes = [];
  for (const name of names) {
    const stat = ffmpeg.FS.stat(path + "/" + name);
    const isDir = ffmpeg.FS.isDir(stat.mode);
    nodes.push({ name, isDir });
  }
  return nodes;
};
const deleteDir = ({ path }) => { ffmpeg.FS.rmdir(path); return true; };
const mount = ({ fsType, options, mountPoint }) => {
  const fs = ffmpeg.FS.filesystems[fsType];
  if (!fs) return false;
  ffmpeg.FS.mount(fs, options, mountPoint);
  return true;
};
const unmount = ({ mountPoint }) => { ffmpeg.FS.unmount(mountPoint); return true; };

self.onmessage = async ({ data: { id, type, data: _data } }) => {
  const trans = [];
  let data;
  try {
    if (type !== FFMessageType.LOAD && !ffmpeg) throw ERROR_NOT_LOADED;
    switch (type) {
      case FFMessageType.LOAD: data = await load(_data); break;
      case FFMessageType.EXEC: data = exec(_data); break;
      case FFMessageType.FFPROBE: data = ffprobe(_data); break;
      case FFMessageType.WRITE_FILE: data = writeFile(_data); break;
      case FFMessageType.READ_FILE: data = readFile(_data); break;
      case FFMessageType.DELETE_FILE: data = deleteFile(_data); break;
      case FFMessageType.RENAME: data = rename(_data); break;
      case FFMessageType.CREATE_DIR: data = createDir(_data); break;
      case FFMessageType.LIST_DIR: data = listDir(_data); break;
      case FFMessageType.DELETE_DIR: data = deleteDir(_data); break;
      case FFMessageType.MOUNT: data = mount(_data); break;
      case FFMessageType.UNMOUNT: data = unmount(_data); break;
      default: throw ERROR_UNKNOWN_MESSAGE_TYPE;
    }
  } catch (e) {
    self.postMessage({ id, type: FFMessageType.ERROR, data: e.toString() });
    return;
  }
  if (data instanceof Uint8Array) trans.push(data.buffer);
  self.postMessage({ id, type, data }, trans);
};
`
}

function createWorkerBlobURL(): string {
  const code = buildInlineWorkerCode()
  const blob = new Blob([code], { type: 'text/javascript' })
  return URL.createObjectURL(blob)
}

async function initFFmpeg(): Promise<{ ffmpeg: any; fetchFile: any }> {
  console.log('[ffmpeg] Importing modules from CDN...')

  // 1. Importer les modules via import map (résolu par le navigateur)
  const [ffmpegMod, utilMod] = await Promise.all([
    dynamicImport('@ffmpeg/ffmpeg'),
    dynamicImport('@ffmpeg/util'),
  ])
  console.log('[ffmpeg] Modules imported')

  const { FFmpeg } = ffmpegMod
  const { toBlobURL, fetchFile } = utilMod

  // 2. Créer notre worker inline (tout le code dans un seul blob, pas d'imports relatifs)
  const inlineWorkerURL = createWorkerBlobURL()
  console.log('[ffmpeg] Inline worker created')

  // 3. Monkey-patch Worker pour intercepter la création
  const OriginalWorker = globalThis.Worker
  globalThis.Worker = class PatchedWorker extends OriginalWorker {
    constructor(url: string | URL, opts?: WorkerOptions) {
      const urlStr = url instanceof URL ? url.href : url.toString()
      if (urlStr.includes('unpkg.com') || urlStr.includes('ffmpeg')) {
        console.log('[ffmpeg] Worker intercepted → using inline blob')
        super(inlineWorkerURL, { type: 'classic' })
      } else {
        super(url, opts)
      }
    }
  } as typeof Worker

  // 4. Charger core + wasm comme blob URLs
  console.log('[ffmpeg] Loading core + wasm...')
  const [coreURL, wasmURL] = await Promise.all([
    toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
    toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
  ])
  console.log('[ffmpeg] Core + WASM loaded as blob URLs')

  // 5. Créer et charger FFmpeg
  const ffmpeg = new FFmpeg()

  try {
    console.log('[ffmpeg] Calling ffmpeg.load()...')
    await ffmpeg.load({ coreURL, wasmURL })
    console.log('[ffmpeg] FFmpeg loaded successfully!')
  } finally {
    globalThis.Worker = OriginalWorker
  }

  return { ffmpeg, fetchFile }
}

function getFFmpeg(): Promise<{ ffmpeg: any; fetchFile: any }> {
  if (!ffmpegReady) {
    ffmpegReady = initFFmpeg().catch((err) => {
      console.error('[ffmpeg] Init error:', err)
      ffmpegReady = null
      throw err
    })
  }
  return ffmpegReady
}

/**
 * Termine l'instance FFmpeg et libère toute la mémoire WASM.
 * La prochaine opération créera une instance fraîche.
 */
function terminateFFmpeg(): void {
  if (ffmpegReady) {
    ffmpegReady
      .then(({ ffmpeg }) => {
        try {
          ffmpeg.terminate()
          console.log('[ffmpeg] Instance terminated — WASM memory freed')
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // ignore — instance was never ready
      })
    ffmpegReady = null
  }
}

export interface TrimResult {
  videoBlob: Blob
  thumbnailBlob: Blob
}

export interface TrimOptions {
  videoUrl: string
  startSeconds: number
  endSeconds: number
  srtContent?: string | null
  onProgress?: (progress: number) => void
}

interface SubtitleEntry {
  start: number
  end: number
  text: string
}

/**
 * Parse un SRT en entrées {start, end, text} en secondes.
 */
function parseSrtEntries(srt: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = []
  const blocks = srt.trim().split(/\n\n+/)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    )
    if (!timeMatch) continue

    const start = +timeMatch[1] * 3600 + +timeMatch[2] * 60 + +timeMatch[3] + +timeMatch[4] / 1000
    const end = +timeMatch[5] * 3600 + +timeMatch[6] * 60 + +timeMatch[7] + +timeMatch[8] / 1000
    const text = lines.slice(2).join(' ').trim()

    if (text) {
      entries.push({ start, end, text })
    }
  }

  return entries
}

/**
 * Rend un texte de sous-titre en PNG transparent via Canvas API.
 * Le PNG fait 1080×200 avec texte blanc + contour noir, centré.
 * On utilise cette approche car drawtext (libfreetype) et subtitles (libass)
 * ne sont pas disponibles dans @ffmpeg/core WASM.
 */
async function renderSubtitlePng(
  text: string,
  width: number = 1080,
  height: number = 200
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Fond transparent
  ctx.clearRect(0, 0, width, height)

  // Style du texte
  ctx.font = 'bold 44px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Word-wrap
  const maxWidth = width - 80
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const lineHeight = 52
  const totalHeight = lines.length * lineHeight
  const startY = (height - totalHeight) / 2 + lineHeight / 2

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight
    const x = width / 2

    // Contour noir
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 8
    ctx.lineJoin = 'round'
    ctx.strokeText(lines[i], x, y)

    // Remplissage blanc
    ctx.fillStyle = 'white'
    ctx.fillText(lines[i], x, y)
  }

  // Convertir en PNG
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Canvas toBlob a retourné null'))
    }, 'image/png')
  })
  return new Uint8Array(await blob.arrayBuffer())
}

/**
 * Génère une miniature JPEG à partir d'un Blob vidéo via Canvas API.
 * Utilise le décodeur vidéo natif du navigateur (pas de WASM).
 */
function generateThumbnailFromBlob(videoBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(videoBlob)
    let captured = false

    const timeout = setTimeout(() => {
      if (!captured) captureFrame()
    }, 10000)

    function captureFrame() {
      if (captured) return
      captured = true
      clearTimeout(timeout)

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          video.src = ''
          if (blob && blob.size > 0) {
            resolve(blob)
          } else {
            // Fallback : retourner un blob vide plutôt que crash
            resolve(new Blob([], { type: 'image/jpeg' }))
          }
        },
        'image/jpeg',
        0.7
      )
    }

    video.onloadeddata = () => {
      if (isFinite(video.duration) && video.duration > 1) {
        video.currentTime = Math.min(1, video.duration * 0.1)
      } else {
        captureFrame()
      }
    }

    video.onseeked = () => captureFrame()

    video.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      // Pas de crash — retourner un blob vide
      resolve(new Blob([], { type: 'image/jpeg' }))
    }

    video.src = url
  })
}

export async function trimAndCropVideo({
  videoUrl,
  startSeconds,
  endSeconds,
  srtContent,
  onProgress,
}: TrimOptions): Promise<TrimResult> {
  console.log('[ffmpeg] Starting trim...')
  onProgress?.(2)
  const { ffmpeg, fetchFile } = await getFFmpeg()

  let subtitleEntries: SubtitleEntry[] = []

  try {
    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      const pct = Math.min(Math.round(progress * 100), 100)
      console.log('[ffmpeg] Encoding:', pct, '%')
      onProgress?.(pct)
    })

    console.log('[ffmpeg] Downloading source video...')
    onProgress?.(5)
    let videoData = await fetchFile(videoUrl)
    console.log('[ffmpeg] Downloaded:', (videoData.byteLength / 1024 / 1024).toFixed(1), 'MB')

    onProgress?.(10)
    await ffmpeg.writeFile('input.mp4', videoData)
    // Libérer le buffer JS pour réduire la pression mémoire
    videoData = null as any

    const duration = endSeconds - startSeconds
    console.log('[ffmpeg] Exec: trim', startSeconds, '→', endSeconds, '(' + duration + 's)')
    onProgress?.(15)

    // Parser et rendre les sous-titres en PNG
    if (srtContent) {
      subtitleEntries = parseSrtEntries(srtContent)
      console.log('[ffmpeg] Subtitles:', subtitleEntries.length, 'entries')

      for (let i = 0; i < subtitleEntries.length; i++) {
        const png = await renderSubtitlePng(subtitleEntries[i].text)
        await ffmpeg.writeFile(`sub_${i}.png`, png)
      }
      if (subtitleEntries.length > 0) {
        console.log('[ffmpeg] Subtitle PNGs written to virtual FS')
      }
    }

    // Construire les arguments FFmpeg
    // -ss avant -i = input seeking (saute directement au bon endroit, économise la mémoire)
    // Les timestamps décodés commencent à ~0 après -ss
    const args: string[] = []

    args.push('-ss', startSeconds.toString())
    args.push('-i', 'input.mp4')

    // Ajouter les PNG de sous-titres comme inputs
    for (let i = 0; i < subtitleEntries.length; i++) {
      args.push('-i', `sub_${i}.png`)
    }

    // filter_complex : trim relatif (timestamps commencent à ~0 grâce au -ss input)
    let fc = `[0:v]trim=end=${duration},setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[base]`
    fc += `;[0:a]atrim=end=${duration},asetpts=PTS-STARTPTS[aout]`

    if (subtitleEntries.length > 0) {
      let prevLabel = 'base'
      for (let i = 0; i < subtitleEntries.length; i++) {
        const inputIdx = i + 1
        const outLabel = i === subtitleEntries.length - 1 ? 'vout' : `v${i}`
        // Les temps SRT sont déjà relatifs au début du clip (generateSrt les ajuste)
        const s = subtitleEntries[i].start.toFixed(3)
        const e = subtitleEntries[i].end.toFixed(3)
        fc += `;[${inputIdx}:v]format=rgba[s${i}];[${prevLabel}][s${i}]overlay=(main_w-overlay_w)/2:main_h-250:enable='between(t,${s},${e})'[${outLabel}]`
        prevLabel = outLabel
      }
    } else {
      // Pas de sous-titres : renommer base → vout
      fc += ';[base]null[vout]'
    }

    args.push('-filter_complex', fc)
    args.push('-map', '[vout]')
    args.push('-map', '[aout]')

    // Encodage vidéo + audio
    args.push(
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '30',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-shortest',
      'output.mp4'
    )

    console.log('[ffmpeg] FFmpeg args:', args.join(' '))
    await ffmpeg.exec(args)

    // Libérer la mémoire WASM : supprimer les inputs dès que l'encodage est fini
    console.log('[ffmpeg] Exec done, freeing input files...')
    try { await ffmpeg.deleteFile('input.mp4') } catch { /* ignore */ }
    for (let i = 0; i < subtitleEntries.length; i++) {
      try { await ffmpeg.deleteFile(`sub_${i}.png`) } catch { /* ignore */ }
    }

    // Lire l'output
    console.log('[ffmpeg] Reading output...')
    const outputData = await ffmpeg.readFile('output.mp4')
    console.log('[ffmpeg] readFile byteLength:', outputData?.byteLength, 'length:', outputData?.length)

    // Supprimer output.mp4 du FS virtuel (la donnée est maintenant en JS)
    try { await ffmpeg.deleteFile('output.mp4') } catch { /* ignore */ }

    // Construire le blob vidéo
    let videoBytes: Uint8Array
    if (outputData instanceof Uint8Array) {
      videoBytes = outputData.slice()
    } else if (typeof outputData === 'string') {
      videoBytes = new TextEncoder().encode(outputData)
    } else {
      throw new Error(`Type inattendu de readFile: ${typeof outputData}`)
    }

    const videoBlob = new Blob([videoBytes.buffer as ArrayBuffer], { type: 'video/mp4' })
    console.log('[ffmpeg] Video blob:', (videoBlob.size / 1024 / 1024).toFixed(1), 'MB')

    if (videoBlob.size === 0) {
      throw new Error('Le clip généré est vide (0 bytes)')
    }

    // Générer la miniature via Canvas API (pas de 2ème exec FFmpeg → économise la mémoire WASM)
    console.log('[ffmpeg] Generating thumbnail via Canvas API...')
    const thumbnailBlob = await generateThumbnailFromBlob(videoBlob)
    console.log('[ffmpeg] Thumbnail blob:', (thumbnailBlob.size / 1024).toFixed(0), 'KB')

    return { videoBlob, thumbnailBlob }
  } finally {
    // Terminer l'instance FFmpeg pour libérer toute la mémoire WASM
    terminateFFmpeg()
  }
}
