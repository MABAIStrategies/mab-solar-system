const { chromium } = require('playwright-core');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 page.on('console',m=>console.log('console',m.type(),m.text()));
 page.on('pageerror',e=>console.log('pageerror',String(e)));
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded',timeout:120000});
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>window.MABHub&&!document.body.classList.contains('intro-active'),null,{timeout:120000});
 console.log('before',await page.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight,active:MABHub.getActiveId(),lenis:!!window.__lenis,stops:[...document.querySelectorAll('.runway-stop')].map(e=>({id:e.dataset.id,top:e.offsetTop,h:e.offsetHeight}))})));
 console.log('jumpReturn',await page.evaluate(()=>MABHub.jumpToId('mechanism')));
 for(let i=0;i<12;i++){
  await page.waitForTimeout(500);
  console.log(i,await page.evaluate(()=>({y:Math.round(scrollY),active:MABHub.getActiveId(),p:MABSpace.getProgress(),remain:MABHub.stationHoldRemaining(),surface:document.querySelector('#surface-layer').dataset.theme,ap:document.querySelector('#aperture-stage').className})));
 }
 await browser.close();
})();
