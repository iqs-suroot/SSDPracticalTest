// Client-side mirror of the server's validation rules (loaded from /validation.js).
// Purely a UX convenience for immediate feedback — the server in server.js repeats
// every check and is the only check that actually matters for security.
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchTerm');
  const errorEl = document.getElementById('clientError');

  form.addEventListener('submit', function (event) {
    const result = SearchValidation.validateSearchTerm(input.value);

    if (!result.valid) {
      event.preventDefault();
      input.value = '';
      errorEl.textContent = result.reason === 'length'
        ? `Search term must be between ${SearchValidation.MIN_LENGTH} and ${SearchValidation.MAX_LENGTH} characters.`
        : 'Invalid input detected. Please try again.';
    } else {
      errorEl.textContent = '';
    }
  });
});
