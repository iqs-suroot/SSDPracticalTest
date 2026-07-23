// Shared search-term validation rules (OWASP Proactive Control C3: Validate All Inputs).
// Loaded by both the server (server.js, via require) and the browser (public/validate.js,
// via a plain <script> tag) so the two stay in sync. Unicode normalization is intentionally
// out of scope per the assignment spec — the allow-list below is plain ASCII.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SearchValidation = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  var MIN_LENGTH = 3;
  var MAX_LENGTH = 50;

  // Allow-list: letters, digits, spaces, and a small set of safe punctuation.
  var ALLOWED_CHARS_PATTERN = /^[A-Za-z0-9 _\-.,]*$/;

  // Defense-in-depth signature checks for common injection payloads. The allow-list
  // above already blocks the characters these rely on (quotes, semicolons, comment
  // markers) — this second layer exists to name the attack explicitly and to catch
  // keyword-based payloads that could slip through a looser allow-list later.
  var ATTACK_PATTERNS = [
    /(--|#|\/\*|\*\/)/,                                            // SQL comment sequences
    /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\balter\b|\bexec\b|\bxp_cmdshell\b)/i,
    /(\bor\b|\band\b)\s+['"]?\s*\w+\s*=\s*\w+/i,                    // e.g. OR 1=1
    /['";]/,                                                       // quote / statement terminators
    /<\s*script/i                                                  // basic XSS payload marker
  ];

  function validateSearchTerm(term) {
    if (typeof term !== 'string') {
      return { valid: false, reason: 'missing' };
    }
    var trimmed = term.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      return { valid: false, reason: 'length' };
    }
    if (!ALLOWED_CHARS_PATTERN.test(trimmed)) {
      return { valid: false, reason: 'attack' };
    }
    var isAttack = ATTACK_PATTERNS.some(function (pattern) {
      return pattern.test(trimmed);
    });
    if (isAttack) {
      return { valid: false, reason: 'attack' };
    }
    return { valid: true, value: trimmed };
  }

  return {
    MIN_LENGTH: MIN_LENGTH,
    MAX_LENGTH: MAX_LENGTH,
    validateSearchTerm: validateSearchTerm
  };
}));
