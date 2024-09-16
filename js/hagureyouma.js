//画像の拡大表示
const modal = document.querySelector('#modal-container');
const img = modal.querySelector('img');
document.querySelectorAll('.popup img').forEach(function (elem) {
	elem.addEventListener('click', () => {
		img.src = elem.src;
		modal.style.display = 'block';
	})
});
modal.addEventListener('click', () => modal.style.display = 'none');

//もくじ自動生成
const hs = document.querySelectorAll('h2');
if (hs.length > 0) {
	let cont = '';
	hs.forEach((h, i) => {
		cont += `<li><a href="#head${i}">${h.textContent}</a></li>`;
		h.insertAdjacentHTML('afterbegin',`<a id="head${i}"></a>`);
	});
	document.querySelector('nav').innerHTML = `<div class="menu"><h3 class="head">目次</h3><ul>${cont}</ul></div>`;
}