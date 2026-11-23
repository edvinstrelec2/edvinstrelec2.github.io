// 11 laboratorinis darbas – svetainės vertinimo forma.
(() => {
  const form = document.querySelector('#feedback-form');
  if (!form) return;

  const fields = Array.from(form.querySelectorAll('input[required]'));
  const phone = form.elements.namedItem('phone');
  const ratings = fields.filter(field => field.type === 'number');
  const submitButton = form.querySelector('button[type="submit"]');
  const results = document.querySelector('#feedback-results');
  const details = results.querySelector('dl');
  const average = document.querySelector('#feedback-average');
  const touched = new Set();
  const letters = /^\p{L}+$/u;
  const mobileNumber = /^\+370 6\d{2} \d{5}$/;
  const formatAverage = new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 2 });

  function phoneDisplay(value) {
    const digits = value.replace(/\D/g, '');
    if (/^(3|37|370)$/.test(digits)) return `+${digits}`;

    const national = digits.replace(/^(370|[08](?=6))/, '').slice(0, 8);
    if (!digits.startsWith('370') && !national.startsWith('6')) return national;

    return ['+370', national.slice(0, 3), national.slice(3)].filter(Boolean).join(' ');
  }

  function formatPhone() {
    const value = phone.value;
    const digitsAfterCaret = value.slice(phone.selectionEnd).replace(/\D/g, '').length;
    const formatted = phoneDisplay(value);
    if (value === formatted) return;

    phone.value = formatted;
    if (!digitsAfterCaret) return;

    const digitsBeforeCaret = formatted.replace(/\D/g, '').length - digitsAfterCaret;
    const digitPositions = Array.from(formatted.matchAll(/\d/g));
    const caret = (digitPositions[digitsBeforeCaret - 1]?.index ?? -1) + 1;
    phone.setSelectionRange(caret, caret);
  }

  function validationError(field) {
    const value = field.value.trim();
    if (field.type === 'number' && field.validity.badInput) {
      return 'Įveskite sveikąjį skaičių nuo 1 iki 10.';
    }
    if (!value) return 'Užpildykite šį lauką.';
    if (field.name === 'first-name' || field.name === 'last-name') {
      return letters.test(value.normalize('NFC')) ? '' : 'Naudokite tik raides.';
    }
    if (field.type === 'email' && (field.validity.typeMismatch || !value.split('@')[1]?.includes('.'))) {
      return 'Įveskite tinkamą el. pašto adresą.';
    }
    if (field === phone && !mobileNumber.test(value)) {
      return 'Įveskite numerį formatu +370 6xx xxxxx.';
    }
    if (field.type === 'number' && !field.validity.valid) {
      return 'Įveskite sveikąjį skaičių nuo 1 iki 10.';
    }
    return '';
  }

  function updateForm() {
    let valid = true;
    for (const field of fields) {
      const error = validationError(field);
      if (error) valid = false;
      const visibleError = touched.has(field) ? error : '';
      const feedback = document.getElementById(field.getAttribute('aria-describedby'));
      feedback.textContent = visibleError;
      field.classList.toggle('is-invalid', Boolean(visibleError));
      if (visibleError) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }
    submitButton.disabled = !valid;
    return valid;
  }

  function handleFieldChange(event) {
    const field = event.target;
    if (!fields.includes(field)) return;
    if (field === phone) formatPhone();
    touched.add(field);
    updateForm();
  }

  form.addEventListener('input', handleFieldChange);
  form.addEventListener('change', handleFieldChange);
  form.addEventListener('focusout', handleFieldChange);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!updateForm()) return;

    const data = Object.fromEntries(
      fields.map(field => [field.name, field.type === 'number' ? field.valueAsNumber : field.value.trim()])
    );
    const score = ratings.reduce((sum, field) => sum + data[field.name], 0) / ratings.length;
    console.log(data);

    const rows = fields.map(field => {
      const row = document.createElement('div');
      const label = document.createElement('dt');
      const value = document.createElement('dd');
      label.textContent = `${field.labels[0].textContent}:`;
      value.textContent = data[field.name];
      row.append(label, value);
      return row;
    });
    details.replaceChildren(...rows);
    average.textContent = `${data['first-name']} ${data['last-name']}: ${formatAverage.format(score)}`;
    results.hidden = false;
  });

  form.addEventListener('reset', (event) => {
    event.preventDefault();
    for (const field of fields) field.value = '';
    touched.clear();
    results.hidden = true;
    details.replaceChildren();
    average.textContent = '';
    updateForm();
  });

  window.addEventListener('pageshow', () => {
    formatPhone();
    updateForm();
  });
  updateForm();
})();
