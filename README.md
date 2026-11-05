# Sotdae

> **현재 개발 중인 프로젝트입니다.**

솟대는 팀에서 공용 계정의 OTP를 함께 관리하는 웹 서비스입니다. 학생회나 동아리에서 권한을 위임할 수 없는 서비스를 쓰다 보면, 공용 계정에 로그인할 때마다 2FA 인증을 위해 OTP를 가진 담당자에게 연락해야 하는 경우가 많습니다. 솟대는 이러한 문제를 해결하기 위해 개발되었으며, 구성원 각자가 개인 이메일로 로그인해 공유받은 OTP를 확인할 수 있습니다.

[Features](#features) · [Tech Stack](#tech-stack) · [Local Development](#local-development) · [Roadmap](#roadmap)

## Features

- **Email Sign-In** · 이메일로 받은 일회용 인증 코드로 솟대에 로그인할 수 있습니다. 인증에 성공하면 서버가 세션을 발급하고, 로그아웃하면 해당 세션을 종료합니다.
- **Shared OTP Setup and Access** · OTP 이름과 서비스명, 시드를 입력하고 공유할 구성원을 이메일로 지정합니다. 서버는 시드를 암호화해 저장합니다. 구성원은 목록에서 외부 서비스 로그인에 쓰는 6자리 코드와 다음 갱신까지 남은 시간을 확인할 수 있습니다. 코드는 30초마다 바뀝니다.
- **Member Management** · 관리자는 OTP마다 구성원을 확인하고, 이메일 주소로 새 구성원을 추가하거나 기존 구성원을 제외할 수 있습니다. 같은 화면에서 구성원의 역할과 OTP 이름, 서비스명도 변경할 수 있습니다.

## Tech Stack

| Category | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| API | Hono, Cloudflare Workers |
| Database | Cloudflare D1 |
| Email Delivery | Resend |

## Local Development

### Prerequisites

- Node.js 24
- pnpm

### 1. Install Dependencies

```sh
pnpm install --frozen-lockfile
```

### 2. Configure Environment Variables

`wrangler.json`과 같은 디렉터리에 `.dev.vars` 파일을 만들고, 아래 세 변수에 로컬 테스트용 값을 설정합니다.

| Variable | Description |
| --- | --- |
| `EMAIL_CODE_PEPPER` | 이메일 인증 코드의 HMAC 생성과 검증에 사용하는 비밀값입니다. |
| `OTP_ENCRYPTION_KEY` | OTP 시드를 암호화하고 복호화하는 AES-GCM 키입니다. 32바이트 키를 16진수 64자리로 입력합니다. |
| `RESEND_API_KEY` | 인증 메일 발송에 사용하는 API 키입니다. 기본 로컬 설정에서는 메일을 보내지 않아 테스트용 문자열을 사용할 수 있습니다. |

`APP_ENV`는 실행 환경을 지정합니다. Worker는 이 값에 따라 인증 메일을 보낼지 결정하고, 메일에 들어갈 로고 URL은 `APP_BASE_URL`을 기준으로 만듭니다. 두 값은 Wrangler 설정에 정의되어 있습니다. [Wrangler Configuration](wrangler.json) · [Cloudflare Environment Variables](https://developers.cloudflare.com/workers/local-development/environment-variables/)

### 3. Apply D1 Migrations

아래 명령으로 `DB` 바인딩에 연결된 로컬 D1에 마이그레이션을 적용합니다. Wrangler와 Vite 개발 서버는 기본 설정에서 `.wrangler/state`에 저장된 로컬 데이터를 함께 사용합니다. [Migrations](migrations/) · [Cloudflare Local Data](https://developers.cloudflare.com/workers/local-development/local-data/)

```sh
pnpm exec wrangler d1 migrations apply DB --local
```

### 4. Start the Development Server

```sh
pnpm dev
```

터미널에 표시된 주소를 브라우저에서 열고 테스트용 이메일을 입력하고, 로컬 Worker 로그에 표시된 인증 코드로 로그인합니다. 로그인한 뒤 테스트용 시드를 등록해 공유 OTP를 조회할 수 있습니다.

## Roadmap

- 마지막 관리자의 제외 및 권한 변경 처리
- 관리자와 일반 사용자의 권한 경계 및 구성원 제외 후 접근 회수 테스트
- 공유 OTP 삭제 기능과 삭제 확인창 추가
- 서버 오류 발생 시 토스트 등으로 오류 내용과 다음 단계 안내
- QR 코드에서 TOTP 설정을 읽어 공유 OTP 등록
- 시트 파일에서 이메일 목록 불러오기
- 모바일 반응형 디자인 적용
- 그 외 사용에 필요한 기능 추가
