import { detailView } from './presentation.mjs';
export const LANGUAGE_KEY = 'damian-pokedex-language-v1';
const pairs = {
 title:['Damian 的宝可梦图鉴',"Damian’s Pokédex"],deviceTitle:['宝可梦图鉴','Pokédex'],trainer:['训练家 Damian','Trainer Damian'],skip:['跳到宝可梦介绍','Skip to Pokémon profile'],deviceLabel:['Damian 的宝可梦图鉴',"Damian’s Pokédex"],
 loadTitle:['图鉴还没打开','The Pokédex could not open'],loadBody:['检查一下网络，再试一次吧。','Check your connection and try again.'],retry:['重新打开','Try again'],opening:['打开图鉴中…','Opening the Pokédex…'],preparing:['准备中','Getting ready'],welcome:['一起认识你的宝可梦伙伴。','Let’s meet your Pokémon friends.'],artLabel:['宝可梦的样子','Pokémon artwork'],profile:['伙伴资料','Pokémon profile'],newProfile:['最新公布的伙伴','Newly announced Pokémon'],imageError:['图片暂时无法显示','Image unavailable'],
 more:['更多资料','More info'],changeForm:['换个样子','Change form'],evolution:['进化伙伴','Evolution family'],allFamily:['看全部','See all'],previous:['上一只','Previous'],next:['下一只','Next'],find:['找伙伴','Find Pokémon'],favorite:['收藏','Favorite'],favorited:['已收藏','Saved'],controls:['图鉴操作','Pokédex controls'],view:['查看{name}','View {name}'],favoriteAction:['收藏{name}','Favorite {name}'],unfavoriteAction:['取消收藏{name}','Unfavorite {name}'],selected:['正在查看{name}','Viewing {name}'],unknownNumber:['全国编号尚未公布','National number not announced'],
 listen:['听介绍','Listen'],audioPreparing:['准备播放','Preparing audio'],audioStop:['停止播放','Stop audio'],recordingsLoading:['录音准备中','Preparing recordings'],voice:['叔叔醇厚男声','Warm uncle voice'],englishAudio:['英文录音尚未提供','English audio isn’t available yet'],audioUnavailable:['这个浏览器暂时不能播放录音，可以直接阅读介绍。','This browser cannot play recordings. You can read the profile.'],audioMissing:['这位伙伴的录音暂时没有准备好，可以先阅读介绍。','This recording is not ready. You can read the profile.'],audioError:['这次录音没能播放，请再点一次，或直接阅读介绍。','The recording could not play. Try again or read the profile.'],audioReady:['录音准备好了，再点一次“听介绍”就能播放。','The recording is ready. Tap Listen again to play.'],audioLoadError:['录音暂时没有加载好，可以稍后再试，或直接阅读介绍。','The recording could not load. Try later or read the profile.'],
 all:['全部伙伴','All Pokémon'],latest:['新伙伴','New Pokémon'],favorites:['我的收藏','My favorites'],catalogGroup:['伙伴分类','Pokémon groups'],searchLabel:['搜索宝可梦名字或编号','Search by Pokémon name or number'],searchPlaceholder:['中文名、英文名或编号','English / Chinese name or number'],clearSearch:['清空搜索','Clear search'],filterSummary:['按属性或世代找','Filter by type or generation'],type:['属性','Type'],generation:['世代','Generation'],allTypes:['全部属性','All types'],allGenerations:['全部世代','All generations'],generationOption:['第 {n} 世代','Generation {n}'],reset:['重置条件','Reset filters'],results:['找到 {n} 位伙伴','{n} Pokémon found'],latestNote:['这些是官方新公布的伙伴。还没公布的资料会在之后补充。','These Pokémon were recently announced. Unannounced details will be added later.'],newBadge:['新伙伴','New'],noFavorites:['还没有收藏伙伴','No favorites yet'],noResults:['还没找到这位伙伴','No Pokémon found'],noFavoritesBody:['回到图鉴，点一下爱心，就能收藏喜欢的伙伴。','Tap a Pokémon’s heart to save it here.'],noResultsBody:['换个名字，或者清除筛选再试试。','Try another name or clear your filters.'],viewAll:['查看全部伙伴','See all Pokémon'],pagination:['图片目录翻页','Pokémon catalogue pages'],previousPage:['‹ 上一页','‹ Previous page'],nextPage:['下一页 ›','Next page ›'],page:['{page} / {total} 页','Page {page} of {total}'],
 closeCatalog:['关闭找伙伴','Close catalogue'],closeForms:['关闭形态选择','Close forms'],closeMore:['关闭更多资料','Close more info'],formIntro:['选一张图片，看看它的另一个样子。','Choose a picture to discover another form.'],formNote:['地区形态、超级进化和普通进化是不同的变化。','Regional forms, Mega Evolution and regular evolution are different changes.'],moreTitle:['{name}的更多资料','More about {name}'],descriptionMissing:['中文特点介绍正在补充。','English information is not available yet.'],englishLoading:['英文资料正在加载…','Loading English details…'],englishFailed:['英文资料未能加载，可重试或切回中文。','English details could not load. Try again or switch to 中文.'],retryEnglish:['重试英文资料','Retry English details'],noEvolutionAnnounced:['进化资料还没有公布。','Evolution details have not been announced.'],noEvolution:['目前没有已知的普通进化。','No regular evolution is currently known.'],
 notFound:['暂时没找到这位伙伴，先看看这只吧。','We could not find that Pokémon. Let’s look at this one.'],savedToast:['已收藏这位伙伴','Pokémon saved'],removedToast:['已取消收藏','Favorite removed'],unsavedToast:['这次收藏已更新；当前浏览器无法保存，关闭后可能丢失。','Favorite updated. This browser cannot save it after you leave.'],
 national:['全国编号','National number'],category:['分类','Category'],form:['形态','Form'],height:['身高','Height'],weight:['体重','Weight'],unknown:['尚未公布','Not announced'],notAvailable:['资料待补充','Not available'],meters:['米','m'],kilograms:['千克','kg'],atLeast:['以上',' or more'],thisForm:['这个形态','This form'],description:['特点介绍','About this Pokémon'],defaultFacts:['了解通常形态的特点','About the normal form'],family:['进化家族','Evolution family'],firstPartner:['最初的伙伴','First in the family'],evolvesFrom:['由{name}进化','Evolves from {name}'],familyNote:['这里展示整个种类的家族。地区形态、进化方法和条件可能随游戏版本不同。','This shows the species’ full family. Regional forms and evolution requirements can vary between games.'],noFamily:['目前没有已知的普通进化。部分宝可梦还可以变化形态。','No regular evolution is known. Some Pokémon can still change form.'],matchups:['属性关系','Type matchups'],weak:['要小心的属性','Weak to'],resist:['能抵抗的属性','Resists'],immune:['能免疫的属性','Immune to'],none:['无','None'],matchupNote:['按属性计算，不计特性、道具或招式带来的额外影响。','Based on types only. Abilities, items and moves can change these results.'],abilities:['特性','Abilities'],hiddenAbility:['隐藏特性','Hidden ability'],abilityMissing:['特性资料尚未公布或补充。','Ability information is not available.'],abilityDescriptionMissing:['特性说明待补充。','Ability description is not available.'],stats:['能力数值','Base stats'],statsMissing:['能力数值尚未公布。','Base stats have not been announced.'],statsNote:['这些是种族值，帮助了解这个种类的能力特点，并不是每一只的实际能力。','Base stats describe the species. Each individual Pokémon’s actual stats can be different.'],hp:['ＨＰ','HP'],attack:['攻击','Attack'],defense:['防御','Defense'],spAttack:['特攻','Sp. Attack'],spDefense:['特防','Sp. Defense'],speed:['速度','Speed'],sources:['资料来源','Sources'],sourceLink:['查看这位伙伴的资料来源','View this Pokémon’s source'],verified:['资料核验：{date}','Data checked: {date}'],about:['关于这本图鉴','About this Pokédex'],speciesCount:['已编号物种','Numbered species'],formCount:['已收录形态','Included forms'],announcedCount:['最新公布','Recently announced'],aboutData:['形态不重复计算为新物种，只列有可用原画的形态。资料随版本更新，不是实时同步。','Forms are not counted as new species. Only forms with artwork are included. Data is checked for each release, not updated live.'],aboutPrivacy:['收藏和上次查看的伙伴保存在当前浏览器，不跨设备同步。中文朗读依赖浏览器提供的中文语音，只在点击时开始；英文暂不提供录音。','Favorites, language and your last Pokémon stay in this browser and do not sync between devices. Chinese narration uses this browser’s available voices and starts only when tapped. English audio is not available yet.'],rights:['非官方爱好者图鉴。宝可梦名称、图片与图鉴文本相关权利归 Pokémon / Nintendo / Creatures / GAME FREAK 等原权利人所有。','An unofficial fan Pokédex. Pokémon names, artwork and game text belong to Pokémon / Nintendo / Creatures / GAME FREAK and their respective owners.'],noscript:['请在浏览器中开启 JavaScript，打开宝可梦图鉴。','Enable JavaScript in your browser to open the Pokédex.'],languageLabel:['界面语言','Interface language'],
};
export const UI = Object.fromEntries(['zh','en'].map((lang,index)=>[lang,Object.fromEntries(Object.entries(pairs).map(([key,value])=>[key,value[index]]))]));
export const EN_TYPES = Object.fromEntries(['normal','fire','water','grass','electric','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'].map(x=>[x,x[0].toUpperCase()+x.slice(1)]));
export function t(language,key,values={}) {return (UI[language]?.[key] || UI.zh[key] || key).replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));}
export function readLanguage(storage){try{return storage.getItem(LANGUAGE_KEY)==='en'?'en':'zh';}catch{return 'zh';}}
export function writeLanguage(storage,language){try{storage.setItem(LANGUAGE_KEY,language==='en'?'en':'zh');return true;}catch{return false;}}
export const pokemonName=(pokemon,language)=>language==='en'?(pokemon.en || pokemon.slug || 'Pokémon'):pokemon.name;
export function localizePokemon(pokemon,language,english){
 if(language!=='en')return pokemon;
 const entry=english?.pokemon?.[pokemon.id];
 return {...pokemon,chineseName:pokemon.chineseName||pokemon.name,name:entry?.name||pokemonName(pokemon,'en'),genus:entry?.genus||'Not available',description:entry?.description||'',descriptionSource:entry?.descriptionSource||entry?.source||pokemon.source,
 forms:(pokemon.forms||[]).map(form=>({...form,label:english?.forms?.[form.id]?.label||'Form',abilities:english?.forms?.[form.id]?.abilities||[]})),
 evolution:(pokemon.evolution||[]).map(node=>({...node,condition:entry?.evolution?.find(item=>item.id===node.id)?.condition||(node.condition?'Evolution details are not available.':'')}))};
}
export function localizedView(pokemon,formId,language,english,typeNames={}){
 const localized=localizePokemon(pokemon,language,english), view=detailView(localized,formId,language==='en'?EN_TYPES:typeNames);
 if(language==='en'){
  view.classificationLabel=view.variant?'Form':'Category';
  const types=(view.form.types||[]).map(type=>EN_TYPES[type]||type);
  if(view.variant)view.description=english?.forms?.[view.form.id]?.description||`Its ${types.length===1?'type is':'types are'} ${types.join(' and ')} (${view.form.label}).`;
  view.shortIntro=view.variant?view.description:(english?.pokemon?.[pokemon.id]?.shortIntro||view.description);
 }
 return view;
}
export function applyDocumentLanguage(document,language){
 document.documentElement.lang=language==='en'?'en':'zh-CN';document.title=t(language,'title');
 for(const node of document.querySelectorAll('[data-i18n]'))node.textContent=t(language,node.dataset.i18n);
 for(const [attribute,key] of [['aria-label','i18nAria'],['placeholder','i18nPlaceholder']])for(const node of document.querySelectorAll(`[data-${key==='i18nAria'?'i18n-aria':'i18n-placeholder'}]`))node.setAttribute(attribute,t(language,node.dataset[key]));
}
export function createLanguageController({storage,fetcher=globalThis.fetch,onState=()=>{},clock=globalThis}={}){
 let sequence=0,active=null,state={language:readLanguage(storage),loading:false,error:false,english:null};
 const emit=()=>onState({...state});
 async function setLanguage(language){
  const token=++sequence;active?.abort();active=null;language=language==='en'?'en':'zh';state={...state,language,loading:false,error:false};writeLanguage(storage,language);
  if(language==='zh'||state.english){emit();return {...state};}
  const controller=new AbortController();active=controller;state.loading=true;emit();let timer;
  try{
   const timeout=new Promise((_,reject)=>{timer=clock.setTimeout(()=>{controller.abort();reject(Error('timeout'));},20_000);timer?.unref?.();controller.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});});
   const data=await Promise.race([(async()=>{const response=await fetcher('data/english.json',{signal:controller.signal});if(!response.ok)throw Error('English data request failed');return response.json();})(),timeout]);
   if(!data?.pokemon||!data.forms||!Object.keys(data.pokemon).length||!Object.keys(data.forms).length)throw Error('Invalid English data');
   if(token===sequence){state={...state,english:data,loading:false,error:false};emit();}
  }catch{if(token===sequence){state={...state,loading:false,error:true};emit();}}
  finally{clock.clearTimeout(timer);if(token===sequence)active=null;}
  return {...state};
 }
 return {setLanguage,get state(){return {...state};}};
}
