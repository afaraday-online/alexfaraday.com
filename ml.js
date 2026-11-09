/*
  mailerlite connection for the sign-up pages.

  forms:  the mailerlite form or landing page id each page sends sign-ups to.
          leave blank and the button sends people to the old mailerlite page instead.
          more than one id? separate them with commas.
  links:  where the ritual "book" button goes (the stripe payment link).
*/
window.AF_MAILERLITE = {
  account: '1223322',
  forms: {
    ritual: '203517122569045693',   // "get future date reminders" -> THE RITUAL DATE REMINDER group
    free:   '',   // the free gifts page picks its forms from the ticked gifts (data-form-id)
    join:   '203517348352624519'    // the inner circle newsletter -> ALL SUBSCRIBERS group
  },
  links: {
    ritualCheckout: 'https://book.stripe.com/14A14mbkicZd4uI6iW2Fa0j',
    ritualFallback: 'https://rnlpnt.subscribepage.io/',
    freeFallback:   'https://alex-faraday-lsb0dz.subscribepage.io/',
    joinFallback:   'https://lxd0qa.subscribepage.io/'
  }
};

(function () {
  var cfg = window.AF_MAILERLITE;

  // booking buttons
  document.querySelectorAll('[data-checkout]').forEach(function (a) {
    a.href = cfg.links.ritualCheckout || cfg.links.ritualFallback;
  });

  // sign-up forms
  document.querySelectorAll('form[data-ml]').forEach(function (form) {
    var key = form.dataset.ml;
    var box = form.closest('[data-signup]') || form.closest('.signup');
    var btn = form.querySelector('[type="submit"]');
    var ids = (cfg.forms[key] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // gift picker: send to the form of each ticked gift
      var picks = form.querySelectorAll('[data-form-id]');
      if (picks.length) {
        ids = Array.prototype.filter.call(picks, function (p) { return p.checked; }).map(function (p) { return p.dataset.formId; });
        if (!ids.length) { box.classList.add('is-error'); return; }
      }
      if (!ids.length) { window.location.href = cfg.links[key + 'Fallback']; return; }

      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'sending…';
      box.classList.remove('is-error');

      var sends = ids.map(function (id) {
        var data = new FormData(form);
        data.append('ml-submit', '1');
        data.append('anticsrf', 'true');
        return fetch('https://assets.mailerlite.com/jsonp/' + cfg.account + '/forms/' + id + '/subscribe', {
          method: 'POST',
          body: data
        }).then(function (r) { return r.json(); }).then(function (j) {
          if (!j || j.success === false) throw new Error('not saved');
        });
      });

      var first = ((form.querySelector('[name="fields[name]"]') || {}).value || '').trim().split(' ')[0];
      Promise.all(sends).then(function () {
        box.querySelectorAll('[data-name-out]').forEach(function (el) { el.textContent = first || 'lovely'; });
        box.classList.add('is-done');
        var done = box.querySelector('.form-done');
        if (done) { done.setAttribute('tabindex', '-1'); done.focus(); }
      }).catch(function () {
        box.classList.add('is-error');
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  });

  // sticky booking bar appears once the main button scrolls out of view
  var sticky = document.querySelector('.sticky-cta');
  var anchor = document.querySelector('[data-sticky-anchor]');
  if (sticky && anchor && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      sticky.classList.toggle('is-visible', !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0);
    }).observe(anchor);
  }
})();
