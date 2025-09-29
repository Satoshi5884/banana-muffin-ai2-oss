import admin from 'firebase-admin'

let app: admin.app.App | null = null

export function getAdminApp() {
  if (app) return app
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!sa) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set')
  }
  const parsed = JSON.parse(sa)

  // 最小構成: project_id, client_email, private_key のみでOK
  // 環境変数に格納する際に \n が含まれる場合は復元する
  const projectId = parsed.projectId || parsed.project_id
  const clientEmail = parsed.clientEmail || parsed.client_email
  const privateKeyRaw = parsed.privateKey || parsed.private_key
  const privateKey = typeof privateKeyRaw === 'string' ? privateKeyRaw.replace(/\\n/g, '\n') : privateKeyRaw

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must include project_id, client_email, private_key')
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  })
  return app
}

export function getDb() {
  return getAdminApp().firestore()
}

export function getAuth() {
  return getAdminApp().auth()
}
