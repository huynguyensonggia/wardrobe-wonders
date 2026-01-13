# Cấu Trúc Thư Mục Dự Án - Élégance

## 📁 Tổng Quan

\`\`\`
src/
├── assets/                    # Hình ảnh, fonts, media files
│   ├── hero-fashion.jpg
│   ├── product-blazer.jpg
│   ├── product-coat.jpg
│   ├── product-dress.jpg
│   └── product-pants.jpg
│
├── components/                # Tất cả components
│   ├── admin/                 # Components dành cho Admin
│   │   └── index.ts
│   ├── auth/                  # Components xác thực (login form, etc.)
│   │   └── index.ts
│   ├── common/                # Components dùng chung
│   │   └── index.ts
│   ├── layout/                # Layout components
│   │   ├── Footer.tsx
│   │   ├── MainLayout.tsx
│   │   ├── Navbar.tsx
│   │   └── index.ts
│   ├── products/              # Components sản phẩm
│   │   ├── ProductCard.tsx
│   │   └── index.ts
│   ├── try-on/                # Components AI Try-On
│   │   └── index.ts
│   └── ui/                    # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ... (các UI components khác)
│
├── contexts/                  # React Contexts
│   ├── AuthContext.tsx
│   └── index.ts
│
├── data/                      # Mock data & constants
│   └── mockData.ts
│
├── hooks/                     # Custom React hooks
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   └── index.ts
│
├── lib/                       # Utilities & services
│   ├── api.ts                 # API client functions
│   ├── utils.ts               # Helper functions
│   └── services/              # Service layer
│       └── index.ts
│
├── pages/                     # Page components
│   ├── admin/                 # Admin pages
│   │   └── index.ts
│   ├── dashboard/             # User dashboard pages
│   │   ├── MyRentals.tsx
│   │   ├── Profile.tsx
│   │   ├── RentalHistory.tsx
│   │   ├── Settings.tsx
│   │   └── index.ts
│   ├── AdminDashboard.tsx
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── NotFound.tsx
│   ├── ProductDetailPage.tsx
│   ├── ProductsPage.tsx
│   ├── RegisterPage.tsx
│   ├── TryOnPage.tsx
│   └── UserDashboard.tsx
│
├── types/                     # TypeScript type definitions
│   └── index.ts
│
├── App.tsx                    # Main app component
├── App.css                    # Global styles (nếu cần)
├── index.css                  # Tailwind & Design system
├── main.tsx                   # Entry point
└── vite-env.d.ts             # Vite type declarations
\`\`\`

## 📋 Hướng Dẫn Sử Dụng

### 🎨 Assets (\`src/assets/\`)
- Lưu trữ hình ảnh, icons, fonts
- Import như ES6 module: \`import heroImage from '@/assets/hero-fashion.jpg'\`

### 🧩 Components (\`src/components/\`)
- **admin/**: Components chỉ dành cho admin (ProductForm, OrderTable, etc.)
- **auth/**: Login form, Register form, Password reset, etc.
- **common/**: Components dùng lại nhiều nơi (LoadingSpinner, Modal, etc.)
- **layout/**: Navbar, Footer, Sidebar, MainLayout
- **products/**: ProductCard, ProductGrid, ProductFilters
- **try-on/**: ImageUploader, TryOnResult, BeforeAfter
- **ui/**: Shadcn components (không chỉnh sửa trực tiếp)

### 📄 Pages (\`src/pages/\`)
- Mỗi route có 1 page component
- Đặt tên: \`[Feature]Page.tsx\`
- Nested pages trong thư mục con (dashboard/, admin/)

### 🔧 Types (\`src/types/\`)
- Định nghĩa TypeScript interfaces
- Export tất cả từ \`index.ts\`

### 🔌 Hooks (\`src/hooks/\`)
- Custom hooks
- Đặt tên: \`use-[feature].ts\`

### 🌐 Contexts (\`src/contexts/\`)
- React Contexts cho global state
- AuthContext, ThemeContext, CartContext, etc.

### 📡 Lib (\`src/lib/\`)
- **api.ts**: Tất cả API calls
- **utils.ts**: Helper functions
- **services/**: Business logic layer

## ✅ Quy Tắc Đặt Tên

| Loại | Quy Tắc | Ví Dụ |
|------|---------|-------|
| Components | PascalCase | \`ProductCard.tsx\` |
| Pages | PascalCase + Page | \`HomePage.tsx\` |
| Hooks | camelCase, prefix use- | \`use-mobile.tsx\` |
| Utils | camelCase | \`formatCurrency.ts\` |
| Types | PascalCase | \`Product\`, \`User\` |
| Constants | UPPER_SNAKE_CASE | \`API_BASE_URL\` |
