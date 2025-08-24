# Magic Hands - 마법 손 게임

실시간 손 인식을 이용한 인터랙티브 마법 게임

## 🎮 기능

- 🎥 실시간 카메라 손 인식 (TensorFlow.js)
- ✋ 제스처 기반 마법 시전
- 🎯 허수아비 타겟 시스템
- 🔊 마법 사운드 효과
- 📊 레벨 & 경험치 시스템
- 💫 실시간 파티클 효과

## 🎯 마법 시전 방법

1. **✊ 주먹** - 마력 충전
2. **마법 선택**
   - 👉 **검지**: 파이어볼 (fire.mp3)
   - ✌️ **브이**: 워터 웨이브 (water.mp3)
   - 🤘 **락**: 라이트닝 (elec.mp3)
3. **✋ 손바닥** - 마법 발사!

## 🛠 기술 스택

- **Frontend**: React 19 + TypeScript
- **AI/ML**: TensorFlow.js (Hand Pose Detection)
- **Build**: Vite + Bun
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **3D**: Three.js

## 🚀 시작하기

### 필수 요구사항
- Node.js 20.19+ 또는 22.12+
- Bun 1.0+
- 웹캠이 있는 디바이스

### 설치 및 실행

```bash
# 의존성 설치
bun install

# 개발 서버 실행
bun run dev

# 프로덕션 빌드
bun run build

# 빌드 프리뷰
bun run preview
```

## 📦 배포

Vercel을 통한 자동 배포가 설정되어 있습니다.

```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 배포
vercel
```

## 🎮 조작법

- **C 키**: 카메라 토글
- **마우스**: 카메라 선택 (여러 카메라가 있을 경우)

## 📝 라이선스

MIT

## 🤝 기여

Pull Request와 이슈는 언제나 환영합니다!
