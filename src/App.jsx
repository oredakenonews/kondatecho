import { useState, useEffect } from "react";
import { MENU_DB, SHOP_CATEGORIES, classifyIngredient } from "./data/recipes";

const DAYS = ["月","火","水","木","金"];
const DAY_LABELS = ["月曜日","火曜日","水曜日","木曜日","金曜日"];
const CATS = ["全て","和食","洋食","中華","その他"];
const EMOJIS = ["🍽️","🥘","🍗","🐟","🥩","🍛","🍝","🍳","🥟","🍜","🍲","🫕","🥗","🌮","🍕","🧀","🥣","🍔","🫓","🦐"];

const C = {
  primary: { padding:"10px 20px", border:"none", borderRadius:"10px", cursor:"pointer", fontFamily:"inherit", fontWeight:700, background:"linear-gradient(135deg,#c8782a,#a05520)", color:"#fff", fontSize:"13px" },
  ghost: { padding:"10px 16px", border:"1px solid rgba(200,120,42,0.4)", borderRadius:"10px", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", background:"transparent", color:"#8a5a30" },
  input: { padding:"10px 12px", borderRadius:"10px", border:"1px solid rgba(200,120,42,0.35)", fontFamily:"inherit", fontSize:"14px", background:"rgba(255,255,255,0.9)", width:"100%", boxSizing:"border-box", outline:"none" },
  label: { fontSize:"12px", color:"#8a5a30", fontWeight:700, letterSpacing:"1px", display:"block", marginBottom:"5px" },
  catBtn: (a) => ({ padding:"5px 14px", border:"1px solid #c8782a", borderRadius:"50px", cursor:"pointer", fontFamily:"inherit", fontSize:"12px", background:a?"linear-gradient(135deg,#c8782a,#a05520)":"transparent", color:a?"#fff":"#c8782a", transition:"all 0.2s" }),
  card: { background:"rgba(255,255,255,0.72)", borderRadius:"16px", backdropFilter:"blur(8px)", border:"1px solid rgba(200,120,42,0.22)" },
  tab: (a) => ({ flex:1, padding:"10px", border:"none", borderRadius:"12px", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:a?700:400, background:a?"linear-gradient(135deg,#c8782a,#a05520)":"transparent", color:a?"#fff":"#8a5a30", transition:"all 0.3s", letterSpacing:"1px" }),
};

const LS_KEYS = {
  custom: "kondatecho_custom_menus",
  checked: "kondatecho_checked_days",
  selected: "kondatecho_selected_menus",
};

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export default function App() {
  const [checkedDays, setCheckedDays] = useState(() => loadLS(LS_KEYS.checked, [true,true,true,true,true]));
  const [selectedMenus, setSelectedMenus] = useState(() => loadLS(LS_KEYS.selected, {}));
  const [showPicker, setShowPicker] = useState(null);
  const [showRecipe, setShowRecipe] = useState(null);
  const [tab, setTab] = useState("planner");
  const [filterCat, setFilterCat] = useState("全て");
  const [customMenus, setCustomMenus] = useState(() => loadLS(LS_KEYS.custom, []));
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState({ name:"", category:"和食", emoji:"🍽️" });
  const [ingRows, setIngRows] = useState([{name:"",amount:""},{name:"",amount:""},{name:"",amount:""}]);
  const [recipeRows, setRecipeRows] = useState(["","",""]);
  const [animDay, setAnimDay] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  // localStorage 同期
  useEffect(() => { localStorage.setItem(LS_KEYS.checked, JSON.stringify(checkedDays)); }, [checkedDays]);
  useEffect(() => { localStorage.setItem(LS_KEYS.selected, JSON.stringify(selectedMenus)); }, [selectedMenus]);
  useEffect(() => { localStorage.setItem(LS_KEYS.custom, JSON.stringify(customMenus)); }, [customMenus]);

  const allMenus = [...MENU_DB, ...customMenus];
  const filtered = filterCat==="全て" ? allMenus : allMenus.filter(m=>m.category===filterCat);

  const toggleDay = (i) => {
    const next=[...checkedDays]; next[i]=!next[i];
    if(!next[i]){ const s={...selectedMenus}; delete s[i]; setSelectedMenus(s); }
    setCheckedDays(next);
  };
  const pick = (di, menu) => {
    setSelectedMenus({...selectedMenus,[di]:menu});
    setAnimDay(di); setTimeout(()=>setAnimDay(null),600);
    setShowPicker(null);
  };
  const rndAll = () => {
    const s={}; checkedDays.forEach((c,i)=>{ if(c) s[i]=allMenus[Math.floor(Math.random()*allMenus.length)]; });
    setSelectedMenus(s);
  };
  const rndDay = (i) => pick(i, allMenus[Math.floor(Math.random()*allMenus.length)]);

  const shopMap = () => {
    const map={};
    Object.values(selectedMenus).forEach(m=>m.ingredients.forEach(ing=>{
      if(!map[ing.name]) map[ing.name]=[];
      map[ing.name].push(ing.amount);
    }));
    const entries = Object.entries(map);
    entries.sort((a,b) => classifyIngredient(a[0]) - classifyIngredient(b[0]));
    return entries;
  };

  const resetForm = () => { setForm({name:"",category:"和食",emoji:"🍽️"}); setIngRows([{name:"",amount:""},{name:"",amount:""},{name:"",amount:""}]); setRecipeRows(["","",""]); setFormStep(1); };
  const openForm = () => { resetForm(); setShowForm(true); };
  const saveMenu = () => {
    if(!form.name.trim()) return;
    const ingredients = ingRows.filter(r=>r.name.trim());
    const recipe = recipeRows.filter(r=>r.trim());
    const newMenu = { id: Date.now(), ...form, ingredients, recipe };
    const updated = [...customMenus, newMenu];
    setCustomMenus(updated);
    setShowForm(false); resetForm();
  };
  const deleteMenu = (id) => {
    setCustomMenus(customMenus.filter(m=>m.id!==id));
    const s={...selectedMenus};
    Object.keys(s).forEach(k=>{ if(s[k].id===id) delete s[k]; });
    setSelectedMenus(s);
  };

  const selectedCount = Object.keys(selectedMenus).length;
  const checkedCount = checkedDays.filter(Boolean).length;

  return (
    <div style={{fontFamily:"'Noto Serif JP','Georgia',serif",minHeight:"100vh",background:"linear-gradient(135deg,#fdf6ec 0%,#f5ece0 50%,#ede0d0 100%)",color:"#3a2a1a",position:"relative"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"radial-gradient(circle at 15% 85%,rgba(180,120,60,0.07) 0%,transparent 50%),radial-gradient(circle at 85% 15%,rgba(200,160,80,0.05) 0%,transparent 50%)"}}/>
      <div style={{position:"fixed",right:"-10px",top:"25%",fontSize:"180px",color:"rgba(180,120,60,0.04)",fontWeight:900,writingMode:"vertical-rl",pointerEvents:"none",zIndex:0,userSelect:"none"}}>献立</div>

      <div style={{maxWidth:"860px",margin:"0 auto",padding:"24px 16px 80px",position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{fontSize:"12px",letterSpacing:"6px",color:"#a07040",marginBottom:"6px"}}>WEEKLY</div>
          <h1 style={{fontSize:"clamp(26px,6vw,40px)",fontWeight:700,margin:0,background:"linear-gradient(135deg,#6b3a1f,#c8782a,#6b3a1f)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"4px"}}>こんだて帖</h1>
          <div style={{width:"50px",height:"2px",background:"linear-gradient(90deg,transparent,#c8782a,transparent)",margin:"10px auto 0"}}/>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:"4px",marginBottom:"20px",background:"rgba(255,255,255,0.45)",borderRadius:"14px",padding:"4px",backdropFilter:"blur(8px)"}}>
          {[["planner","📅 献立"],["shopping","🛒 買い物リスト"],["menus","📖 メニュー管理"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={C.tab(tab===t)}>{l}</button>
          ))}
        </div>

        {/* PLANNER */}
        {tab==="planner"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"18px"}}>
              <button onClick={rndAll} style={{...C.primary,borderRadius:"50px",boxShadow:"0 4px 12px rgba(200,120,42,0.3)"}}>🎲 全日ランダム選択</button>
              <span style={{fontSize:"12px",color:"#a07040"}}>{selectedCount}/{checkedCount}日 選択済み</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {DAYS.map((day,i)=>(
                <div key={i} style={{...C.card,padding:"12px 14px",opacity:checkedDays[i]?1:0.45,transform:animDay===i?"scale(1.015)":"scale(1)",boxShadow:animDay===i?"0 6px 20px rgba(200,120,42,0.18)":"none",transition:"all 0.35s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:checkedDays[i]?"8px":"0"}}>
                    <div onClick={()=>toggleDay(i)} style={{width:"22px",height:"22px",borderRadius:"6px",border:"2px solid #c8782a",flexShrink:0,background:checkedDays[i]?"linear-gradient(135deg,#c8782a,#a05520)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s"}}>
                      {checkedDays[i]&&<span style={{color:"#fff",fontSize:"13px",lineHeight:1}}>✓</span>}
                    </div>
                    <div style={{width:"38px",height:"38px",borderRadius:"50%",flexShrink:0,background:checkedDays[i]?"linear-gradient(135deg,#c8782a,#a05520)":"#ccc",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:"15px"}}>{day}</div>
                    {selectedMenus[i]?(
                      <div style={{flex:1,display:"flex",alignItems:"center",gap:"8px",minWidth:0}}>
                        <span style={{fontSize:"24px",flexShrink:0}}>{selectedMenus[i].emoji}</span>
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:"15px",lineHeight:1.3}}>{selectedMenus[i].name}</div>
                          <div style={{fontSize:"11px",color:"#a07040",marginTop:"2px"}}>{selectedMenus[i].category}</div>
                        </div>
                      </div>
                    ):(
                      <div style={{flex:1,color:"#b09070",fontSize:"13px",fontStyle:"italic"}}>{checkedDays[i]?"メニューを選択してください":"お休み"}</div>
                    )}
                  </div>
                  {checkedDays[i]&&(
                    <div style={{display:"flex",gap:"6px",paddingLeft:"70px"}}>
                      {selectedMenus[i]&&<button onClick={()=>setShowRecipe(selectedMenus[i])} style={{flex:1,padding:"6px 0",border:"1px solid #c8782a",borderRadius:"7px",background:"rgba(200,120,42,0.08)",color:"#c8782a",cursor:"pointer",fontFamily:"inherit",fontSize:"12px"}}>📖 レシピ</button>}
                      <button onClick={()=>rndDay(i)} style={{flex:1,padding:"6px 0",border:"1px solid #c8782a",borderRadius:"7px",background:"rgba(200,120,42,0.08)",color:"#c8782a",cursor:"pointer",fontFamily:"inherit",fontSize:"12px"}}>🎲 ランダム</button>
                      <button onClick={()=>setShowPicker(i)} style={{flex:1,padding:"6px 0",border:"none",borderRadius:"7px",background:"linear-gradient(135deg,#c8782a,#a05520)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:"12px",fontWeight:600}}>✏️ 選択</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOPPING */}
        {tab==="shopping"&&(
          <div>
            {selectedCount===0?(
              <div style={{textAlign:"center",padding:"60px 20px",color:"#a07040"}}>
                <div style={{fontSize:"48px",marginBottom:"12px"}}>🛒</div>
                <div>献立を選択すると買い物リストが表示されます</div>
              </div>
            ):(
              <div>
                <div style={{...C.card,padding:"14px 16px",marginBottom:"14px"}}>
                  <div style={{fontSize:"12px",color:"#a07040",marginBottom:"6px"}}>今週の献立</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                    {Object.entries(selectedMenus).map(([di,m])=>(
                      <span key={di} style={{padding:"3px 10px",borderRadius:"50px",fontSize:"12px",background:"rgba(200,120,42,0.12)",color:"#8a4020"}}>{DAYS[di]}: {m.emoji} {m.name}</span>
                    ))}
                  </div>
                </div>
                <div style={{...C.card,padding:"18px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                    <h3 style={{margin:0,fontSize:"17px",letterSpacing:"2px",color:"#6b3a1f"}}>🛒 買い物リスト</h3>
                    <button onClick={()=>setCheckedItems({})} style={{fontSize:"11px",color:"#a07040",background:"none",border:"none",cursor:"pointer"}}>チェックをリセット</button>
                  </div>
                  {(()=>{
                    const items = shopMap();
                    const result = [];
                    let lastCat = null;
                    items.forEach(([name, amounts]) => {
                      const catIdx = classifyIngredient(name);
                      const catLabel = catIdx < SHOP_CATEGORIES.length ? SHOP_CATEGORIES[catIdx].label : "🛍️ その他";
                      if (catLabel !== lastCat) {
                        result.push(
                          <div key={"cat-"+catLabel} style={{fontSize:"12px",fontWeight:700,color:"#a07040",letterSpacing:"1px",marginTop:result.length>0?"14px":"0",marginBottom:"6px"}}>
                            {catLabel}
                          </div>
                        );
                        lastCat = catLabel;
                      }
                      const done = checkedItems[name];
                      result.push(
                        <div key={name} onClick={()=>setCheckedItems(c=>({...c,[name]:!c[name]}))} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"10px",background:done?"rgba(0,0,0,0.03)":"rgba(255,255,255,0.65)",border:"1px solid rgba(200,120,42,0.15)",cursor:"pointer",opacity:done?0.5:1,transition:"all 0.2s",marginBottom:"5px"}}>
                          <div style={{width:"18px",height:"18px",borderRadius:"5px",border:"1.5px solid #c8782a",flexShrink:0,background:done?"#c8782a":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {done&&<span style={{color:"#fff",fontSize:"11px"}}>✓</span>}
                          </div>
                          <span style={{flex:1,fontSize:"14px",fontWeight:600,textDecoration:done?"line-through":"none"}}>{name}</span>
                          <span style={{fontSize:"12px",color:"#a07040",background:"rgba(200,120,42,0.1)",padding:"2px 8px",borderRadius:"50px"}}>{amounts.join(" + ")}</span>
                        </div>
                      );
                    });
                    return result;
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MENUS */}
        {tab==="menus"&&(
          <div>
            <div style={{display:"flex",gap:"7px",marginBottom:"14px",flexWrap:"wrap",alignItems:"center"}}>
              {CATS.map(cat=><button key={cat} onClick={()=>setFilterCat(cat)} style={C.catBtn(filterCat===cat)}>{cat}</button>)}
              <button onClick={openForm} style={{...C.primary,marginLeft:"auto",borderRadius:"50px",padding:"7px 16px"}}>＋ メニュー追加</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:"10px"}}>
              {filtered.map(menu=>(
                <div key={menu.id} style={{...C.card,padding:"14px",transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
                    <span style={{fontSize:"30px"}}>{menu.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:"14px"}}>{menu.name}</div>
                      <div style={{fontSize:"11px",color:"#a07040"}}>{menu.category} · 材料{menu.ingredients.length}品目</div>
                    </div>
                    {customMenus.find(m=>m.id===menu.id)&&(
                      <button onClick={()=>deleteMenu(menu.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"14px",color:"#ccc",flexShrink:0}} title="削除">🗑️</button>
                    )}
                  </div>
                  <button onClick={()=>setShowRecipe(menu)} style={{width:"100%",padding:"6px",border:"1px solid #c8782a",borderRadius:"7px",background:"rgba(200,120,42,0.08)",color:"#c8782a",cursor:"pointer",fontFamily:"inherit",fontSize:"12px",fontWeight:600}}>レシピを見る</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PICKER MODAL */}
      {showPicker!==null&&(
        <div style={{position:"fixed",inset:0,background:"rgba(40,20,5,0.5)",zIndex:100,display:"flex",alignItems:"flex-end",backdropFilter:"blur(4px)"}} onClick={()=>setShowPicker(null)}>
          <div style={{width:"100%",maxHeight:"78vh",background:"#fdf6ec",borderRadius:"24px 24px 0 0",padding:"20px",overflowY:"auto",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <h3 style={{margin:0,color:"#6b3a1f",letterSpacing:"2px"}}>{DAY_LABELS[showPicker]}のメニュー</h3>
              <button onClick={()=>setShowPicker(null)} style={{background:"none",border:"none",fontSize:"20px",cursor:"pointer",color:"#a07040"}}>✕</button>
            </div>
            <div style={{display:"flex",gap:"6px",marginBottom:"12px",flexWrap:"wrap"}}>
              {CATS.map(cat=><button key={cat} onClick={()=>setFilterCat(cat)} style={C.catBtn(filterCat===cat)}>{cat}</button>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:"9px"}}>
              {filtered.map(menu=>(
                <div key={menu.id} onClick={()=>pick(showPicker,menu)} style={{background:selectedMenus[showPicker]?.id===menu.id?"rgba(200,120,42,0.18)":"rgba(255,255,255,0.85)",borderRadius:"12px",padding:"12px",cursor:"pointer",border:`2px solid ${selectedMenus[showPicker]?.id===menu.id?"#c8782a":"rgba(200,120,42,0.2)"}`,textAlign:"center",transition:"all 0.15s"}}>
                  <div style={{fontSize:"26px",marginBottom:"5px"}}>{menu.emoji}</div>
                  <div style={{fontSize:"12px",fontWeight:700}}>{menu.name}</div>
                  <div style={{fontSize:"10px",color:"#a07040",marginTop:"2px"}}>{menu.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RECIPE MODAL */}
      {showRecipe&&(
        <div style={{position:"fixed",inset:0,background:"rgba(40,20,5,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",backdropFilter:"blur(4px)"}} onClick={()=>setShowRecipe(null)}>
          <div style={{background:"#fdf6ec",borderRadius:"20px",padding:"22px",maxWidth:"480px",width:"100%",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"18px"}}>
              <div>
                <div style={{fontSize:"38px",marginBottom:"3px"}}>{showRecipe.emoji}</div>
                <h2 style={{margin:0,color:"#6b3a1f",fontSize:"20px",letterSpacing:"2px"}}>{showRecipe.name}</h2>
                <div style={{fontSize:"11px",color:"#a07040",marginTop:"3px"}}>{showRecipe.category}</div>
              </div>
              <button onClick={()=>setShowRecipe(null)} style={{background:"none",border:"none",fontSize:"22px",cursor:"pointer",color:"#a07040"}}>✕</button>
            </div>
            <h4 style={{margin:"0 0 9px",color:"#6b3a1f",fontSize:"13px",letterSpacing:"2px",borderBottom:"1px solid rgba(200,120,42,0.3)",paddingBottom:"5px"}}>📋 材料</h4>
            <div style={{display:"grid",gap:"5px",marginBottom:"18px"}}>
              {showRecipe.ingredients.map((ing,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderRadius:"7px",background:i%2===0?"rgba(200,120,42,0.07)":"transparent"}}>
                  <span style={{fontSize:"13px"}}>{ing.name}</span>
                  <span style={{fontSize:"12px",color:"#a07040",fontWeight:600}}>{ing.amount}</span>
                </div>
              ))}
            </div>
            <h4 style={{margin:"0 0 9px",color:"#6b3a1f",fontSize:"13px",letterSpacing:"2px",borderBottom:"1px solid rgba(200,120,42,0.3)",paddingBottom:"5px"}}>👩‍🍳 作り方</h4>
            <div style={{display:"grid",gap:"9px"}}>
              {showRecipe.recipe.map((step,i)=>(
                <div key={i} style={{display:"flex",gap:"10px",alignItems:"flex-start"}}>
                  <div style={{width:"24px",height:"24px",borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#c8782a,#a05520)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700}}>{i+1}</div>
                  <div style={{paddingTop:"3px",fontSize:"13px",lineHeight:1.75,color:"#4a3020"}}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD MENU MODAL */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(40,20,5,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",backdropFilter:"blur(4px)"}} onClick={()=>setShowForm(false)}>
          <div style={{background:"#fdf6ec",borderRadius:"20px",padding:"22px",maxWidth:"460px",width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"20px"}}>
              {[1,2,3].map(s=>(
                <div key={s} style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  <div style={{width:"28px",height:"28px",borderRadius:"50%",background:formStep>=s?"linear-gradient(135deg,#c8782a,#a05520)":"rgba(200,120,42,0.15)",color:formStep>=s?"#fff":"#c8782a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:700,flexShrink:0}}>{formStep>s?"✓":s}</div>
                  {s<3&&<div style={{width:"20px",height:"2px",background:formStep>s?"#c8782a":"rgba(200,120,42,0.2)"}}/>}
                </div>
              ))}
              <span style={{marginLeft:"6px",fontSize:"13px",color:"#8a5a30",fontWeight:700,flex:1}}>{["","① 基本情報","② 材料","③ 作り方"][formStep]}</span>
              <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",fontSize:"20px",cursor:"pointer",color:"#a07040"}}>✕</button>
            </div>

            {formStep===1&&(
              <div style={{display:"grid",gap:"16px"}}>
                <div>
                  <label style={C.label}>料理名 *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="例：チキン南蛮" style={C.input} autoFocus/>
                </div>
                <div>
                  <label style={C.label}>カテゴリ</label>
                  <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                    {["和食","洋食","中華","その他"].map(c=><button key={c} onClick={()=>setForm({...form,category:c})} style={C.catBtn(form.category===c)}>{c}</button>)}
                  </div>
                </div>
                <div>
                  <label style={C.label}>絵文字を選ぶ</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
                    {EMOJIS.map(e=>(
                      <div key={e} onClick={()=>setForm({...form,emoji:e})} style={{width:"36px",height:"36px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",cursor:"pointer",border:`2px solid ${form.emoji===e?"#c8782a":"rgba(200,120,42,0.2)"}`,background:form.emoji===e?"rgba(200,120,42,0.12)":"rgba(255,255,255,0.7)",transition:"all 0.15s"}}>{e}</div>
                    ))}
                  </div>
                </div>
                <button onClick={()=>{ if(form.name.trim()) setFormStep(2); }} style={{...C.primary,opacity:form.name.trim()?1:0.45}}>次へ：材料を入力 →</button>
              </div>
            )}

            {formStep===2&&(
              <div style={{display:"grid",gap:"14px"}}>
                <p style={{margin:0,fontSize:"13px",color:"#8a5a30"}}>材料名と分量を入力してください。</p>
                <div style={{display:"grid",gap:"8px"}}>
                  {ingRows.map((row,i)=>(
                    <div key={i} style={{display:"flex",gap:"7px",alignItems:"center"}}>
                      <input value={row.name} onChange={e=>{const r=[...ingRows];r[i]={...r[i],name:e.target.value};setIngRows(r);}} placeholder={`材料 ${i+1}`} style={{...C.input,flex:2}}/>
                      <input value={row.amount} onChange={e=>{const r=[...ingRows];r[i]={...r[i],amount:e.target.value};setIngRows(r);}} placeholder="分量" style={{...C.input,flex:1}}/>
                      {ingRows.length>1&&<button onClick={()=>setIngRows(ingRows.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:"16px",color:"#c0392b",flexShrink:0,padding:"0 4px"}}>✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={()=>setIngRows([...ingRows,{name:"",amount:""}])} style={{...C.ghost,fontSize:"13px",textAlign:"left"}}>＋ 材料を追加</button>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>setFormStep(1)} style={C.ghost}>← 戻る</button>
                  <button onClick={()=>setFormStep(3)} style={{...C.primary,flex:1}}>次へ：作り方を入力 →</button>
                </div>
              </div>
            )}

            {formStep===3&&(
              <div style={{display:"grid",gap:"14px"}}>
                <p style={{margin:0,fontSize:"13px",color:"#8a5a30"}}>調理の手順を1ステップずつ入力してください。</p>
                <div style={{display:"grid",gap:"8px"}}>
                  {recipeRows.map((row,i)=>(
                    <div key={i} style={{display:"flex",gap:"8px",alignItems:"flex-start"}}>
                      <div style={{width:"26px",height:"26px",borderRadius:"50%",flexShrink:0,marginTop:"10px",background:"linear-gradient(135deg,#c8782a,#a05520)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700}}>{i+1}</div>
                      <textarea value={row} onChange={e=>{const r=[...recipeRows];r[i]=e.target.value;setRecipeRows(r);}} placeholder={`手順 ${i+1}`} rows={2} style={{...C.input,resize:"vertical"}}/>
                      {recipeRows.length>1&&<button onClick={()=>setRecipeRows(recipeRows.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:"16px",color:"#c0392b",flexShrink:0,marginTop:"10px",padding:"0 4px"}}>✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={()=>setRecipeRows([...recipeRows,""])} style={{...C.ghost,fontSize:"13px",textAlign:"left"}}>＋ 手順を追加</button>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>setFormStep(2)} style={C.ghost}>← 戻る</button>
                  <button onClick={saveMenu} style={{...C.primary,flex:1}}>✅ 登録する</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(200,120,42,0.3);border-radius:2px}
        button:active{opacity:0.8}
      `}</style>
    </div>
  );
}
