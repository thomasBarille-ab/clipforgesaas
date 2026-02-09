interface UploadOptions {
  supabaseUrl: string
  supabaseAnonKey: string
  bucket: string
  path: string
  file: File
  token: string
  onProgress: (percent: number) => void
}

interface UploadResult {
  data: { path: string; fullPath: string; id: string } | null
  error: string | null
}

export function uploadWithProgress({
  supabaseUrl,
  supabaseAnonKey,
  bucket,
  path,
  file,
  token,
  onProgress,
}: UploadOptions): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve({
            data: {
              path,
              fullPath: response.Key ?? `${bucket}/${path}`,
              id: response.Id ?? '',
            },
            error: null,
          })
        } catch {
          resolve({ data: { path, fullPath: `${bucket}/${path}`, id: '' }, error: null })
        }
      } else {
        let message = `Erreur serveur (${xhr.status})`
        try {
          const err = JSON.parse(xhr.responseText)
          message = err.message || err.error || message
        } catch {
          // use default message
        }
        resolve({ data: null, error: message })
      }
    })

    xhr.addEventListener('error', () => {
      resolve({ data: null, error: "Erreur réseau lors de l'envoi du fichier" })
    })

    xhr.addEventListener('abort', () => {
      resolve({ data: null, error: 'Envoi annulé' })
    })

    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', supabaseAnonKey)
    xhr.setRequestHeader('x-upsert', 'false')

    const formData = new FormData()
    formData.append('cacheControl', '3600')
    formData.append('', file)

    xhr.send(formData)
  })
}
