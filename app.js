// GutCheck app logic: camera barcode scan -> Open Food Facts lookup ->
// run the shared FODMAP analyzer (fodmap-data.js) -> render a traffic-light result.
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const scanbox = $('#scanbox'), video = $('#video'), startBtn = $('#startBtn'),
        stopBtn = $('#stopBtn'), statusEl = $('#scanStatus'), resultEl = $('#result'),
        manualForm = $('#manualForm'), manualCode = $('#manualCode');

  let reader = null, controls = null, scanning = false;

  function setStatus(msg) { statusEl.textContent = msg || ''; }

  function stopScan() {
    scanning = false;
    try { controls && controls.stop(); } catch (e) {}
    try { reader && reader.reset(); } catch (e) {}
    controls = null;
    scanbox.hidden = true;
    startBtn.hidden = false;
    setStatus('');
  }

  async function startScan() {
    if (typeof ZXing === 'undefined') {
      setStatus('The scanning library didn’t load. Check your connection, or use "Type a barcode instead".');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('This browser can’t access the camera. Use "Type a barcode instead" below.');
      return;
    }
    resultEl.innerHTML = '';
    scanbox.hidden = false;
    startBtn.hidden = true;
    setStatus('Starting camera…');
    reader = reader || new ZXing.BrowserMultiFormatReader();
    scanning = true;
    try {
      controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        video,
        (result, err) => {
          if (result && scanning) {
            const code = result.getText();
            scanning = false;
            setStatus('Found ' + code);
            stopScan();
            lookup(code);
          }
          // err fires continuously (NotFoundException) while no barcode is
          // in frame -- that's normal and not surfaced to the viewer.
        }
      );
      setStatus('Point your camera at a barcode.');
    } catch (e) {
      scanning = false;
      scanbox.hidden = true;
      startBtn.hidden = false;
      if (e && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')) {
        setStatus('Camera access was blocked. Allow it in your browser’s site settings, or type a barcode instead.');
      } else if (e && e.name === 'NotFoundError') {
        setStatus('No camera was found on this device. Type a barcode instead.');
      } else {
        setStatus('Couldn’t start the camera. Type a barcode instead.');
      }
    }
  }

  startBtn.addEventListener('click', startScan);
  stopBtn.addEventListener('click', stopScan);
  manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = manualCode.value.replace(/\D/g, '');
    if (!code) return;
    stopScan();
    lookup(code);
  });

  function renderLoading(code) {
    resultEl.innerHTML = `<div class="panel sec"><p><span class="spinner" aria-hidden="true"></span>Looking up ${esc(code)}…</p></div>`;
  }

  function renderNotFound(code) {
    resultEl.innerHTML = `<div class="panel sec">
      <h3>Not found</h3>
      <p class="sub">Open Food Facts doesn’t have a listing for barcode <b>${esc(code)}</b> yet. That doesn’t mean the product is safe or unsafe — just uncatalogued. Check the ingredients on the pack directly, or try the <a href="https://world.openfoodfacts.org/product/${esc(code)}" target="_blank" rel="noopener">Open Food Facts page</a> in case it’s still indexing.</p>
    </div>`;
  }

  function renderError(msg) {
    resultEl.innerHTML = `<div class="panel sec"><h3>Couldn’t look that up</h3><p class="sub">${esc(msg)}</p></div>`;
  }

  function renderResult(code, product) {
    const name = product.product_name_en || product.product_name || 'Unnamed product';
    const brand = product.brands ? esc(product.brands) : '';
    const img = product.image_front_small_url || product.image_front_url || '';
    const hasEnglish = !!(product.ingredients_text_en && product.ingredients_text_en.trim());
    const ingredientsText = product.ingredients_text_en || product.ingredients_text || '';

    if (!ingredientsText.trim()) {
      resultEl.innerHTML = `<div class="panel sec">
        <div class="product">${img ? `<img src="${esc(img)}" alt="">` : ''}<div><h3>${esc(name)}</h3>${brand ? `<p class="small muted">${brand}</p>` : ''}</div></div>
        <p class="sub">Open Food Facts has this product, but no ingredients list on file for it. Check the pack directly, or try typing the ingredients into <a href="https://claude.ai/artifact/1JmcoeDJR7peXYEFwYpJLR" target="_blank" rel="noopener">Gutwise</a>’s food check.</p>
      </div>`;
      return;
    }

    const a = analyze(ingredientsText);
    let verdictHtml, itemsHtml;
    if (!a.items.length) {
      verdictHtml = !hasEnglish
        ? `<p class="sub">This product’s ingredients on Open Food Facts don’t seem to be in English, so GutCheck couldn’t match them automatically. Check the raw text below, or the pack itself.</p>`
        : `<p class="sub">No FODMAP-relevant ingredients recognised in the listed ingredients. That doesn’t guarantee it’s low FODMAP — the FODMAP guide only covers foods it knows about.</p>`;
      itemsHtml = '';
    } else {
      const reds = a.items.filter((f) => f.l === 'r'), ambs = a.items.filter((f) => f.l === 'a');
      const vd = {
        g: ['Looks low FODMAP', 'Every ingredient recognised is low FODMAP in normal serves.'],
        a: ['Fine in the right portions', 'Keep an eye on the amber ingredients: ' + ambs.map((f) => f.n).join(', ') + '.'],
        r: ['Contains high FODMAP ingredients', 'Likely worth avoiding or checking the serve size for: ' + reds.map((f) => f.n).join(', ') + '.'],
      }[a.level];
      verdictHtml = `<div class="verdict ${a.level}"><span class="dot ${a.level}"></span><div><b>${vd[0]}</b><span>${vd[1]}</span></div></div>`;
      itemsHtml = `<div class="list">${a.items
        .map(
          (f) =>
            `<div class="item"><span class="dot ${f.l}"></span><div><div class="nm">${esc(f.n)}</div><div class="meta">${f.t
              .map((t) => `<span class="tag">${TYPES[t].n}</span>`)
              .join('')}<span>${esc(f.note)}</span></div>${f.l !== 'g' && f.swap ? `<div class="meta" style="grid-column:auto;margin-top:4px"><b style="color:var(--ink)">Try instead:</b> ${esc(f.swap)}</div>` : ''}</div><span class="light ${f.l}">${LV[f.l]}</span></div>`
        )
        .join('')}</div>`;
    }

    resultEl.innerHTML = `<div class="panel lift sec">
      <div class="product">${img ? `<img src="${esc(img)}" alt="">` : ''}<div><h3>${esc(name)}</h3>${brand ? `<p class="small muted">${brand}</p>` : ''}</div></div>
      ${verdictHtml}
      ${itemsHtml}
      <div class="row" style="justify-content:space-between;align-items:center">
        <button class="btn ghost small" id="copyIngBtn" type="button">Copy ingredients</button>
        <span class="small muted">Paste into Gutwise’s food check to log it there.</span>
      </div>
      <details class="manual"><summary>Ingredients list read from Open Food Facts</summary><p class="small muted" style="padding-top:8px">${esc(ingredientsText)}</p></details>
    </div>`;

    const copyBtn = $('#copyIngBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const label = brand ? `${name} (${brand}): ` : `${name}: `;
        try {
          await navigator.clipboard.writeText(label + ingredientsText);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy ingredients'; }, 1800);
        } catch (e) {
          copyBtn.textContent = 'Select the text below to copy';
        }
      });
    }
  }

  async function lookup(code) {
    renderLoading(code);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_en,brands,ingredients_text,ingredients_text_en,image_front_url,image_front_small_url`);
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        renderNotFound(code);
        return;
      }
      renderResult(code, data.product);
    } catch (e) {
      renderError('Something went wrong reaching Open Food Facts. Check your connection and try again.');
    }
  }
})();
