/**
 * 渲染后视觉计量脚本。
 *
 * 这段代码在**浏览器页面上下文**里执行（不是 Node），所以：
 * - 不能引用本模块外的任何东西，必须自包含
 * - 以字符串形式导出，由 driver 注入
 *
 * 与静态检查（check.js 扫 CSS 文件）的区别：那个查「对不对」——色值是不是
 * 达标的 token；这个查「多少」——这一页实际用了几种字号、灰阶拉开几层、
 * 多少元素真的有过渡动效。丑的每一处单看往往都"对"，只有计量能抓出来。
 *
 * ⚠️ 改这段前必读：可见性判断绝不能用 getBoundingClientRect() 或
 * checkVisibility()。它们是**布局查询**，与 getComputedStyle（**样式查询**）
 * 交替调用会触发 layout thrashing —— 单独跑各自都是几毫秒，交替跑几千个元素
 * 直接卡死（实测在 7000 元素的页面上从 29ms 劣化到 2 分钟以上仍未返回）。
 * 只用 display / visibility / opacity 判断，这三个属性读的是已算好的样式。
 */
export const METRIC_SCRIPT = `(() => {
  const t0 = performance.now();
  const add = (m, v) => { if (v === null || v === undefined || v === '') return; m[v] = (m[v] || 0) + 1; };
  const fontSize={}, fontWeight={}, family={}, radius={}, duration={}, timing={},
        shadow={}, gap={}, pad={}, bgLum={}, fgLum={};

  // rgb/rgba -> 感知亮度。近透明的不计入，否则每个透明背景都会算成一层灰阶。
  const lum = (c) => {
    const m = c.match(/[0-9.]+/g);
    if (!m || m.length < 3) return null;
    if (m.length > 3 && parseFloat(m[3]) < 0.1) return null;
    return Math.round(0.2126*+m[0] + 0.7152*+m[1] + 0.0722*+m[2]);
  };

  let visible = 0, textEls = 0, motionEls = 0;
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) <= 0.05) continue;
    visible++;
    if (s.borderRadius !== '0px') add(radius, s.borderRadius);
    if (s.transitionDuration !== '0s') {
      motionEls++;
      add(duration, s.transitionDuration);
      add(timing, s.transitionTimingFunction);
    }
    if (s.boxShadow !== 'none') add(shadow, s.boxShadow);
    if (s.gap !== 'normal' && s.gap !== '0px') add(gap, s.gap);
    if (s.paddingTop !== '0px') add(pad, s.paddingTop);
    add(bgLum, lum(s.backgroundColor));

    // 只统计「自己直接持有文本」的元素。否则每层容器都会继承一次字号，
    // 样本被容器层数放大，集中度算出来失真。
    let hasText = false;
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.textContent.trim()) { hasText = true; break; }
    }
    if (hasText) {
      textEls++;
      add(fontSize, Math.round(parseFloat(s.fontSize)));
      add(fontWeight, s.fontWeight);
      add(family, s.fontFamily.split(',')[0].replace(/["']/g, '').trim());
      add(fgLum, lum(s.color));
    }
  }

  // cover = 前 4 种的覆盖率。集中度才是判据，种类数只作横向参考——
  // 设计标杆站的字号种类同样可以很多，少不等于好。
  const dist = (m) => {
    const ent = Object.entries(m).sort((a,b) => b[1]-a[1]);
    const total = ent.reduce((s,e) => s+e[1], 0);
    const top4 = ent.slice(0,4).reduce((s,e) => s+e[1], 0);
    return {
      kinds: ent.length,
      cover: total ? +(top4/total).toFixed(3) : 0,
      top: ent.slice(0,8).map(e => ({ v: String(e[0]), n: e[1] }))
    };
  };

  return {
    visible, textEls, motionEls, ms: Math.round(performance.now() - t0),
    fontSize: dist(fontSize), fontWeight: dist(fontWeight), family: dist(family),
    radius: dist(radius), duration: dist(duration), timing: dist(timing),
    shadow: dist(shadow), gap: dist(gap), pad: dist(pad),
    bgLum: dist(bgLum), fgLum: dist(fgLum)
  };
})()`

/** 带 transition 的元素占比。区分度最大的单项指标。 */
export function motionRate(m) {
  return m.visible ? m.motionEls / m.visible : 0
}
