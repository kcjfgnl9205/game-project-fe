import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const DEV_DOMAIN = 'local.puzmu.com'
const certDir = fileURLToPath(new URL('../.certs/', import.meta.url))
const keyPath = `${certDir}${DEV_DOMAIN}-key.pem`
const certPath = `${certDir}${DEV_DOMAIN}.pem`

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: 'inherit' })
}

// mkcert가 없으면 안내하고 종료한다 (시스템 경계).
try {
  execFileSync('mkcert', ['-version'], { stdio: 'ignore' })
} catch {
  console.error('mkcert가 필요합니다.  설치: brew install mkcert nss')
  process.exit(1)
}

mkdirSync(certDir, { recursive: true })

// 로컬 CA를 신뢰 저장소에 등록 (이미 돼 있으면 무해).
run('mkcert', ['-install'])

// .certs/ 아래에 명시적 파일명으로 발급 → vite.config가 읽는 경로와 일치.
run('mkcert', ['-key-file', keyPath, '-cert-file', certPath, DEV_DOMAIN])

if (existsSync(keyPath) && existsSync(certPath)) {
  console.log(`\n✅ 인증서 생성 완료: .certs/${DEV_DOMAIN}.pem`)
  console.log('   npm run dev 로 https://local.puzmu.com:5173 접속하세요.')
} else {
  console.error('인증서 생성에 실패했습니다.')
  process.exit(1)
}
