# 习概选择题答题网页

这是修正版 Vercel 静态项目。

## 项目结构

```text
public/
  index.html
  style.css
  app.js
  questions.js
package.json
vercel.json
```

## Vercel 设置

- Framework Preset：Other
- Build Command：`npm run build`
- Output Directory：`public`
- Install Command：留空或 `npm install`

## 本地部署

```bash
npm install
npm run build
npx vercel deploy --prod --yes
```
