/**
 * blueprint.js
 * Ward Visitor System — Blueprint v9
 * Tab navigation for the interactive design document.
 */

function show(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  el.classList.add('active');
}
