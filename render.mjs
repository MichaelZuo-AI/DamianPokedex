import { typeMatchups } from './logic.mjs';

export const TYPES = {
  normal: ['一般', '#727980', '#edf0f2', '●'], fire: ['火', '#db5437', '#fff0e9', '♨'], water: ['水', '#327cc7', '#e9f3ff', '◒'],
  grass: ['草', '#4d943d', '#eef7e9', '❧'], electric: ['电', '#947008', '#fff1bc', 'ϟ'], ice: ['冰', '#248d9b', '#e9f8fa', '❄'],
  fighting: ['格斗', '#bb5146', '#ffefeb', '✊'], poison: ['毒', '#9859a6', '#f7ecfa', '◉'], ground: ['地面', '#aa7943', '#faf1e6', '▰'],
  flying: ['飞行', '#697ab3', '#eef0ff', '➶'], psychic: ['超能力', '#ce5684', '#ffedf5', '◎'], bug: ['虫', '#7f8d25', '#f4f7df', '♧'],
  rock: ['岩石', '#96813e', '#f5f1e2', '⬡'], ghost: ['幽灵', '#756298', '#f0ebfa', '♟'], dragon: ['龙', '#5c66b7', '#efedff', '♜'],
  dark: ['恶', '#665d64', '#f0edf0', '☾'], steel: ['钢', '#587d89', '#edf4f5', '⬢'], fairy: ['妖精', '#bb648c', '#fff0f7', '✦']
};
export const TYPE_NAMES = Object.fromEntries(Object.entries(TYPES).map(([key, value]) => [key, value[0]]));
export const escapeHTML = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function typeBadge(type, multiplier = null) {
  const [name, color, tint, symbol] = TYPES[type] || [type, '#727980', '#edf0f2', '●'];
  return `<span class="type-badge" style="--badge-color:${color};--badge-tint:${tint}"><span class="type-icon" aria-hidden="true">${symbol}</span>${escapeHTML(name)}${multiplier === null ? '' : `<b>×${multiplier}</b>`}</span>`;
}
export function sourceLink(url, label) {
  return /^https?:\/\//.test(url || '') ? `<a class="source-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>` : '';
}
function measurement(value, unit, atLeast = false) {
  return value === null || value === undefined ? '尚未公布' : `${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} ${unit}${atLeast ? '以上' : ''}`;
}
function familyMarkup(pokemon, view, byId) {
  const family = pokemon.evolution || [];
  if (family.length <= 1) return `<p class="source-note">${pokemon.announced ? '进化资料尚未公布。' : '目前没有已知的普通进化。部分宝可梦还可以变化形态。'}</p>`;
  return `<div class="family-grid">${family.map(node => {
    const other = byId.get(node.id), from = byId.get(node.fromId);
    if (!other) return '';
    return `<button type="button" class="family-card${other.id === pokemon.id ? ' current' : ''}" data-select-pokemon="${escapeHTML(other.id)}" aria-label="查看${escapeHTML(other.name)}"><span class="image-frame"><img src="${escapeHTML(other.image)}" alt="" width="90" height="90" loading="lazy"></span><span>${escapeHTML(other.name)}</span><small>${from ? `由${escapeHTML(from.name)}进化` : '最初的伙伴'}</small>${node.condition && view.showDefaultEvolutionConditions ? `<small>${escapeHTML(node.condition)}</small>` : ''}</button>`;
  }).join('')}</div><p class="matchup-note">这里展示整个种类的家族。地区形态、进化方法和条件可能随游戏版本不同。</p>`;
}
function matchupMarkup(types, chart) {
  const matchups = typeMatchups(types, chart);
  return [['weak', '要小心的属性'], ['resist', '能抵抗的属性'], ['immune', '能免疫的属性']].map(([key, title]) => `<div class="matchup-group"><h4>${title}</h4><div class="matchup-chips">${matchups[key].length ? matchups[key].map(m => typeBadge(m.type, m.multiplier)).join('') : '<span class="source-note">无</span>'}</div></div>`).join('') + '<p class="matchup-note">按属性计算，不计特性、道具或招式带来的额外影响。</p>';
}
function statsMarkup(stats) {
  if (!stats || !Object.values(stats).some(v => v !== null && v !== undefined)) return '<p class="source-note">能力数值尚未公布。</p>';
  return `<div class="stats">${Object.entries({ hp: 'ＨＰ', attack: '攻击', defense: '防御', spAttack: '特攻', spDefense: '特防', speed: '速度' }).map(([key, label]) => `<div class="stat-row"><span>${label}</span><b>${stats[key] ?? '—'}</b><span class="stat-track" aria-hidden="true"><span class="stat-fill" style="width:${Math.min(100, (stats[key] || 0) / 255 * 100)}%"></span></span></div>`).join('')}</div><p class="matchup-note">这些是种族值，帮助了解这个种类的能力特点，并不是每一只的实际能力。</p>`;
}

export function moreMarkup(pokemon, view, snapshot, byId) {
  const form = view.form, meta = snapshot.meta;
  return `<div class="profile-heading"><h3>${escapeHTML(pokemon.name)}</h3><p>${escapeHTML(pokemon.en)}${view.variant ? ` / ${escapeHTML(form.label)}` : ''}</p></div>
    <dl class="facts-grid"><div><dt>全国编号</dt><dd>${pokemon.number ? String(pokemon.number).padStart(3, '0') : '尚未公布'}</dd></div><div><dt>世代</dt><dd>第 ${pokemon.generation} 世代</dd></div><div><dt>${escapeHTML(view.classificationLabel)}</dt><dd>${escapeHTML(view.classificationValue || '资料待补充')}</dd></div><div><dt>身高</dt><dd>${measurement(form.height, '米', form.heightAtLeast)}</dd></div><div><dt>体重</dt><dd>${measurement(form.weight, '千克')}</dd></div></dl>
    <section class="data-section"><h3>${view.variant ? '这个形态' : '特点介绍'}</h3><p class="full-description">${escapeHTML(view.description || '中文特点介绍待补充。')}</p>${view.baseDescription ? `<details><summary>了解通常形态的特点</summary><p class="full-description">${escapeHTML(view.baseDescription)}</p></details>` : ''}</section>
    <section id="full-family" class="data-section"><h3>进化家族</h3>${familyMarkup(pokemon, view, byId)}</section>
    <section class="data-section"><h3>属性关系</h3>${matchupMarkup(form.types || pokemon.types, snapshot.typeChart)}</section>
    <section class="data-section"><h3>特性</h3>${form.abilities?.length ? form.abilities.map(a => `<div class="ability-item"><h4>${escapeHTML(a.name)}${a.hidden ? '<small>隐藏特性</small>' : ''}</h4><p>${escapeHTML(a.description || '特性说明待补充。')}</p></div>`).join('') : '<p class="source-note">特性资料尚未公布或补充。</p>'}</section>
    <section class="data-section"><h3>能力数值</h3>${statsMarkup(form.stats)}</section>
    <section class="data-section"><h3>资料来源</h3>${sourceLink(pokemon.descriptionSource || pokemon.source, '查看这位伙伴的资料来源')}<p class="source-note">资料核验：${escapeHTML(meta.updatedAt)}</p></section>
    <details class="about-section"><summary>关于这本图鉴</summary><dl class="facts-grid"><div><dt>已编号物种</dt><dd>${meta.speciesCount} 种</dd></div><div><dt>已收录形态</dt><dd>${meta.formCount} 个（含通常形态）</dd></div><div><dt>最新公布</dt><dd>${snapshot.pokemon.filter(p => p.announced).length} 位</dd></div></dl><ul class="sources-list">${(meta.sources || []).map(s => `<li>${sourceLink(s.url, s.label)}</li>`).join('')}</ul><p class="source-note">形态不重复计算为新物种，只列有可用原画的形态。${meta.descriptionMissingCount ? `有${meta.descriptionMissingCount}条中文介绍待补充。` : '所有已收录伙伴均有中文介绍。'}${meta.formsWithoutAbilitiesCount ? `有${meta.formsWithoutAbilitiesCount}个形态的特性资料待补充。` : ''}资料随版本更新，不是实时同步。</p><p class="source-note">收藏和上次查看的伙伴保存在当前浏览器，不跨设备同步。朗读使用设备提供的语音，实际声音取决于浏览器和系统语音。</p><p class="source-note">非官方爱好者图鉴。宝可梦名称、图片与图鉴文本相关权利归 Pokémon / Nintendo / Creatures / GAME FREAK 等原权利人所有。</p></details>`;
}
