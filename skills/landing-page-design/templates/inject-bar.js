#!/usr/bin/env node
// Post-build HTML info bar injector
// 用途：在 Vite 构建后的 dist/*.html 中注入悬浮 info bar（项目元数据）
// 为什么 post-build：Vite 8 的 parse5 对内联 <style> + 复杂 DOM 解析极严，
// post-build 注入纯 inline style + JS 可 100% 绕过 parse5 限制。
//
// 用法：vite build && node inject-bar.js
const fs = require('fs');
const path = require('path');

// 修改此处为你的页面元数据
const PAGES = [
  { file: 'page1.html', title: '示例页面', accent: '#7c3aed', meta: ['Claude Code', '2026-06-17', 'Canvas'] },
  // 添加更多页面...
];

const distDir = path.join(__dirname, 'dist');

PAGES.forEach(p => {
  const filePath = path.join(distDir, p.file);
  if (!fs.existsSync(filePath)) return;
  
  let html = fs.readFileSync(filePath, 'utf-8');
  
  // 纯 inline style info bar，不依赖任何 <style> 标签
  const barHtml = `
<div id="infoBar" style="position:fixed;bottom:0;left:0;right:0;z-index:99999;display:flex;align-items:center;justify-content:space-between;padding:8px 20px;background:rgba(10,10,15,0.85);backdrop-filter:blur(12px);border-top:1px solid rgba(255,255,255,0.06);font-size:11px;transform:translateY(calc(100% - 28px));transition:transform 0.3s cubic-bezier(0.22,1,0.36,1);cursor:pointer;">
  <div style="display:flex;align-items:center;gap:12px;">
    <div style="width:6px;height:6px;border-radius:50%;background:${p.accent};flex-shrink:0;"></div>
    <span style="color:rgba(255,255,255,0.9);font-weight:500;font-size:12px;">${p.title}</span>
    ${p.meta.map(m => `<span style="padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-size:10px;">${m}</span>`).join('')}
    <span style="color:rgba(255,255,255,0.2);font-size:10px;">悬停展开 · 返回</span>
  </div>
</div>
<script>(function(){var b=document.getElementById("infoBar");b.addEventListener("mouseenter",function(){this.style.transform="translateY(0)"});b.addEventListener("mouseleave",function(){this.style.transform="translateY(calc(100% - 28px))"});b.addEventListener("click",function(){window.location.href="index.html"})})()</script>`;
  
  if (html.includes('</body>')) {
    html = html.replace('</body>', barHtml + '</body>');
    fs.writeFileSync(filePath, html);
    console.log(`✅ ${p.file} — bar injected`);
  }
});
