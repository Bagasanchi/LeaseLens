(() => {
  const text = (en, mn) => root.lang === 'mn' ? mn : en;
  function button(parent, title, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = title;
    b.onclick = async () => {
      b.disabled = true;
      try { await handler(); }
      catch { status.textContent = text('Request failed. Check your connection and try again.', 'Хүсэлт амжилтгүй боллоо. Холболтоо шалгаад дахин оролдоно уу.'); }
      finally { b.disabled = false; }
    };
    parent.append(b);
    return b;
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'library-dialog card';
  dialog.setAttribute('aria-labelledby', 'account-heading');
  document.body.append(dialog);
  const close = button(dialog, '', () => dialog.close());
  const body = document.createElement('section');
  body.className = 'card';
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const content = document.createElement('div');
  const heading = document.createElement('h2');
  heading.id = 'account-heading';
  body.append(heading, status, content);
  dialog.append(body);
  let saving = false;
  let revision = 0;
  let activeUser;
  const library = button(document.querySelector('main'), '', () => open(false));
  const saveComparison = button(el('report'), '', () => open(true));
  function labels() {
    close.textContent = text('Close', 'Хаах');
    library.textContent = text('My library', 'Миний сан');
    saveComparison.textContent = text('Save comparison', 'Харьцуулалт хадгалах');
    heading.textContent = saving ? saveComparison.textContent : library.textContent;
  }
  function open(save) {
    saving = save;
    dialog.showModal();
    return render();
  }
  function result(response) {
    if (response.error) throw response.error;
    return response.data;
  }
  function signInForm() {
    line(content, 'p', text('Sign in with the same email on each device to access your library.', 'Бүх төхөөрөмж дээрээ ижил имэйлээр нэвтэрч сангаа нээнэ үү.'));
    const form = document.createElement('form');
    const label = document.createElement('label');
    label.textContent = text('Email address', 'Имэйл хаяг');
    const email = document.createElement('input');
    email.type = 'email'; email.autocomplete = 'email'; email.required = true;
    label.append(email);
    const send = document.createElement('button');
    send.type = 'submit'; send.textContent = text('Email me a sign-in link', 'Нэвтрэх холбоос авах');
    form.append(label, send); content.append(form);
    form.onsubmit = async e => {
      e.preventDefault(); send.disabled = true;
      try {
        result(await cloud.auth.signInWithOtp({email: email.value.trim(), options: {emailRedirectTo: location.origin + '/'}}));
        status.textContent = text('Check your email. Open the link on this device, then return to your comparison.', 'Имэйлээ шалгана уу. Холбоосыг энэ төхөөрөмж дээр нээгээд харьцуулалт руугаа буцна уу.');
      } catch {
        status.textContent = text('Could not send the link. Check your address and try again later.', 'Холбоос илгээж чадсангүй. Хаягаа шалгаад дахин оролдоно уу.');
      } finally { send.disabled = false; }
    };
  }
  async function list(kind, owner, version) {
    const purchases = kind === 'lease_purchases';
    const date = purchases ? 'purchased_at' : 'created_at';
    const section = document.createElement('section');
    content.append(section);
    line(section, 'h3', purchases ? text('Past purchases', 'Худалдан авалтын түүх') : text('Saved comparisons', 'Хадгалсан харьцуулалт'));
    let offset = 0;
    async function page() {
      const rows = result(await cloud.from(kind).select(purchases ? 'id,title,purchased_at,amount_mnt,file_path' : 'id,title,created_at')
        .eq('user_id', owner).order(date,{ascending:false}).order('id').range(offset, offset + 20));
      if (version !== revision) return;
      if (!offset && !rows.length) line(section, 'p', purchases ? text('No purchases yet.', 'Худалдан авалт байхгүй.') : text('No saved comparisons yet.', 'Хадгалсан харьцуулалт байхгүй.'));
      for (const row of rows.slice(0,20)) {
        const entry = document.createElement('div'); section.append(entry);
        line(entry, 'strong', row.title);
        const locale = root.lang === 'mn' ? 'mn-MN' : 'en';
        line(entry, 'p', new Date(row[date]).toLocaleDateString(locale) + (purchases ? ' · ' + row.amount_mnt.toLocaleString(locale) + ' ₮' : ''));
        if (purchases) {
          if (row.file_path) button(entry, text('Download', 'Татах'), async () => {
            const blob = result(await cloud.storage.from('lease-purchases').download(row.file_path));
            if(version !== revision) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = row.file_path.split('/').pop(); a.click();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          });
          continue;
        }
        button(entry, text('Open', 'Нээх'), async () => {
          if (['promise','lease','revised'].some(k => el(k).value) && !confirm(text('Replace your current draft?', 'Одоогийн нооргийг солих уу?'))) return;
          const draft = result(await cloud.from(kind).select('promise,lease,revised').eq('id',row.id).single());
          if (version !== revision) return;
          for (const k of ['promise','lease','revised']) el(k).value = draft[k];
          el('form').requestSubmit(); el('diff').replaceChildren();
          if (draft.revised) { el('revised').closest('details').open = true; el('compare').click(); }
          dialog.close(); el('check').scrollIntoView();
        });
        button(entry, text('Delete', 'Устгах'), async () => {
          if (!confirm(text('Delete this saved comparison?', 'Энэ харьцуулалтыг устгах уу?'))) return;
          result(await cloud.from(kind).delete().eq('id',row.id)); await render();
        });
      }
      offset += 20;
      if (rows.length > 20) {
        const more = button(section, text('Show more', 'Нэмж харах'), async () => { await page(); more.remove(); });
      }
    }
    await page();
  }
  async function render() {
    const version = ++revision;
    labels(); content.replaceChildren(); status.textContent = text('Loading…', 'Ачаалж байна…');
    try {
      const {session} = result(await cloud.auth.getSession());
      if (version !== revision) return;
      status.textContent = '';
      if (!session) { signInForm(); return; }
      line(content, 'p', session.user.email);
      if (saving) {
        line(content, 'p', text('Saving uploads your promise, lease wording and revision to your account.', 'Хадгалах үед амлалт, гэрээний эх болон засварласан хувилбар таны бүртгэлд хадгалагдана.'));
        button(content, text('Save to my account', 'Бүртгэлдээ хадгалах'), async () => {
          const draft = Object.fromEntries(['promise','lease','revised'].map(k => [k,el(k).value]));
          if (!draft.promise.trim() || !draft.lease.trim()) { status.textContent = text('Enter your promise and lease first.', 'Эхлээд амлалт болон гэрээг оруулна уу.'); return; }
          result(await cloud.from('lease_comparisons').insert(draft));
          saving = false; await render(); status.textContent = text('Comparison saved.', 'Харьцуулалтыг хадгаллаа.');
        });
      } else {
        await Promise.all([list('lease_comparisons',session.user.id,version), list('lease_purchases',session.user.id,version)]);
      }
      if (version === revision) button(content, text('Sign out', 'Гарах'), async () => { result(await cloud.auth.signOut({scope:'local'})); await render(); });
    } catch {
      if (version !== revision) return;
      status.textContent = text('Your library could not load.', 'Таны санг ачаалж чадсангүй.');
      button(content, text('Retry', 'Дахин оролдох'), render);
    }
  }
  dialog.addEventListener('close', () => { revision++; content.replaceChildren(); status.textContent = ''; });
  language.addEventListener('change', () => { labels(); if (dialog.open) void render(); });
  cloud.auth.onAuthStateChange((event, session) => {
    const user = session?.user.id;
    if (activeUser !== user) {
      activeUser = user;
      if (dialog.open) setTimeout(() => { if (dialog.open) void render(); }, 0);
    }
  });
  labels();
})();
