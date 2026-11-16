import { t, EN_TYPES, localizePokemon } from './i18n.mjs';
import { typeMatchups } from './logic.mjs';
import { imageSrc } from './images.mjs';

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

export function typeBadge(type, multiplier = null, language = 'zh') {
  const [chinese, color, tint, symbol] = TYPES[type] || [type, '#727980', '#edf0f2', '●'];
  const name = language === 'en' ? EN_TYPES[type] || type : chinese;
  return `<span class="type-badge" style="--badge-color:${color};--badge-tint:${tint}"><span class="type-icon" aria-hidden="true">${symbol}</span>${escapeHTML(name)}${multiplier === null ? '' : `<b>×${multiplier}</b>`}</span>`;
}
export function sourceLink(url, label) {
  return /^https?:\/\//.test(url || '') ? `<a class="source-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>` : '';
}
function measurement(value, unit, atLeast, language) {
  if(value === null || value === undefined)return t(language,'unknown');
  const number=Number(value).toLocaleString(language==='en'?'en-US':'zh-CN',{maximumFractionDigits:2});
  return language==='en'?`${atLeast?'at least ':''}${number} ${unit==='米'?'m':'kg'}`:`${number} ${unit}${atLeast?'以上':''}`;
}
function familyMarkup(pokemon, view, byId, language, english) {
  const say=(zh,en)=>language==='en'?en:zh, family=pokemon.evolution||[];
  if(family.length<=1)return `<p class="source-note">${pokemon.announced?t(language,'noEvolutionAnnounced'):say('目前没有已知的普通进化。部分宝可梦还可以变化形态。','No regular evolution is currently known. Some Pokémon can change forms.')}</p>`;
  return `<div class="family-grid">${family.map(node=>{
    const raw=byId.get(node.id),fromRaw=byId.get(node.fromId);if(!raw)return '';
    const other=localizePokemon(raw,language,english),from=fromRaw?localizePokemon(fromRaw,language,english):null;
    return `<button type="button" class="family-card${other.id===pokemon.id?' current':''}" data-select-pokemon="${escapeHTML(other.id)}" aria-label="${escapeHTML(t(language,'view',{name:other.name}))}"><span class="image-frame"><img src="${imageSrc(other.image,160)}" alt="" width="90" height="90" loading="lazy" decoding="async"></span><span>${escapeHTML(other.name)}</span><small>${from?escapeHTML(say(`由${from.name}进化`,`Evolves from ${from.name}`)):say('最初的伙伴','First in the family')}</small>${node.condition&&view.showDefaultEvolutionConditions?`<small>${escapeHTML(node.condition)}</small>`:''}</button>`;
  }).join('')}</div><p class="matchup-note">${say('这里展示整个种类的家族。地区形态、进化方法和条件可能随游戏版本不同.','This shows the species’ whole family. Regional forms and evolution requirements can vary between games.')}</p>`;
}
function matchupMarkup(types,chart,language){
 const say=(zh,en)=>language==='en'?en:zh, matchups=typeMatchups(types,chart);
 return [['weak',say('要小心的属性','Weak against')],['resist',say('能抵抗的属性','Resists')],['immune',say('能免疫的属性','Immune to')]].map(([key,title])=>`<div class="matchup-group"><h4>${title}</h4><div class="matchup-chips">${matchups[key].length?matchups[key].map(m=>typeBadge(m.type,m.multiplier,language)).join(''):`<span class="source-note">${say('无','None')}</span>`}</div></div>`).join('')+`<p class="matchup-note">${say('按属性计算，不计特性、道具或招式带来的额外影响。','Based on types only; abilities, held items and move effects may change the result.')}</p>`;
}
function statsMarkup(stats,language){
 const say=(zh,en)=>language==='en'?en:zh;
 if(!stats||!Object.values(stats).some(v=>v!==null&&v!==undefined))return `<p class="source-note">${say('能力数值尚未公布。','Base stats have not been announced.')}</p>`;
 const names=language==='en'?{hp:'HP',attack:'Attack',defense:'Defense',spAttack:'Sp. Atk',spDefense:'Sp. Def',speed:'Speed'}:{hp:'ＨＰ',attack:'攻击',defense:'防御',spAttack:'特攻',spDefense:'特防',speed:'速度'};
 return `<div class="stats">${Object.entries(names).map(([key,label])=>`<div class="stat-row"><span>${label}</span><b>${stats[key]??'—'}</b><span class="stat-track" aria-hidden="true"><span class="stat-fill" style="width:${Math.min(100,(stats[key]||0)/255*100)}%"></span></span></div>`).join('')}</div><p class="matchup-note">${say('这些是种族值，帮助了解这个种类的能力特点，并不是每一只的实际能力。','These base stats describe the species, not an individual Pokémon’s actual stats.')}</p>`;
}
export function moreMarkup(basePokemon,view,snapshot,byId,{language='zh',english=null}={}){
 const pokemon=localizePokemon(basePokemon,language,english),form=view.form,meta=snapshot.meta,say=(zh,en)=>language==='en'?en:zh;
 const sources=language==='en'?(english?.meta?.sources||[]):meta.sources||[];
 const missing=language==='en'?english?.meta?.descriptionMissingCount:meta.descriptionMissingCount;
 return `<div class="profile-heading"><h3>${escapeHTML(pokemon.name)}</h3><p${language==='en'?' class="chinese-name" lang="zh-CN"':''}>${escapeHTML(language==='en'?pokemon.chineseName:pokemon.en)}${view.variant?` / ${escapeHTML(form.label)}`:''}</p></div>
 <dl class="facts-grid"><div><dt>${t(language,'national')}</dt><dd>${pokemon.number?String(pokemon.number).padStart(3,'0'):t(language,'unknown')}</dd></div><div><dt>${t(language,'generation')}</dt><dd>${say(`第 ${pokemon.generation} 世代`,`Generation ${pokemon.generation}`)}</dd></div><div><dt>${escapeHTML(view.classificationLabel)}</dt><dd>${escapeHTML(view.classificationValue||t(language,'unknown'))}</dd></div><div><dt>${t(language,'height')}</dt><dd>${measurement(form.height,'米',form.heightAtLeast,language)}</dd></div><div><dt>${t(language,'weight')}</dt><dd>${measurement(form.weight,'千克',false,language)}</dd></div></dl>
 <section class="data-section"><h3>${view.variant?say('这个形态','This form'):say('特点介绍','About this Pokémon')}</h3><p class="full-description">${escapeHTML(view.description||t(language,'descriptionMissing'))}</p>${view.baseDescription?`<details><summary>${say('了解通常形态的特点','About the regular form')}</summary><p class="full-description">${escapeHTML(view.baseDescription)}</p></details>`:''}</section>
 <section id="full-family" class="data-section"><h3>${t(language,'evolution')}</h3>${familyMarkup(pokemon,view,byId,language,english)}</section>
 <section class="data-section"><h3>${say('属性关系','Type matchups')}</h3>${matchupMarkup(form.types||pokemon.types,snapshot.typeChart,language)}</section>
 <section class="data-section"><h3>${say('特性','Abilities')}</h3>${form.abilities?.length?form.abilities.map(a=>`<div class="ability-item"><h4>${escapeHTML(a.name)}${a.hidden?`<small>${say('隐藏特性','Hidden ability')}</small>`:''}</h4><p>${escapeHTML(a.description||say('特性说明待补充。','Ability details are not available.'))}</p></div>`).join(''):`<p class="source-note">${say('特性资料尚未公布或补充。','Ability details have not been announced or added.')}</p>`}</section>
 <section class="data-section"><h3>${say('能力数值','Base stats')}</h3>${statsMarkup(form.stats,language)}</section>
 <section class="data-section"><h3>${say('资料来源','Sources')}</h3>${sourceLink(pokemon.descriptionSource||pokemon.source,say('查看这位伙伴的资料来源','View this Pokémon’s source'))}<p class="source-note">${say('资料核验：','Data checked: ')}${escapeHTML(language==='en'?(english?.meta?.updatedAt||meta.updatedAt):meta.updatedAt)}</p>${language==='en'?`<p class="source-note">Base data checked: ${escapeHTML(meta.updatedAt)}</p>`:''}</section>
 <details class="about-section"><summary>${say('关于这本图鉴','About this Pokédex')}</summary><dl class="facts-grid"><div><dt>${t(language,'speciesCount')}</dt><dd>${meta.speciesCount}</dd></div><div><dt>${t(language,'formCount')}</dt><dd>${meta.formCount} ${say('个（含通常形态）','(including regular forms)')}</dd></div><div><dt>${t(language,'announcedCount')}</dt><dd>${snapshot.pokemon.filter(p=>p.announced).length}</dd></div></dl><ul class="sources-list">${sources.map(s=>`<li>${sourceLink(s.url,s.label)}</li>`).join('')}</ul><p class="source-note">${t(language,'aboutData')}${meta.formsWithoutAbilitiesCount?say(`有${meta.formsWithoutAbilitiesCount}个形态的特性资料待补充。`,`${meta.formsWithoutAbilitiesCount} forms do not yet have ability details.`):''}${missing?say(`有${missing}条中文介绍待补充。`,`${missing} English descriptions are not available yet.`):''}</p><p class="source-note">${t(language,'aboutPrivacy')}</p><p class="source-note">${t(language,'rights')}</p></details>`;
}
