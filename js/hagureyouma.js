//画像の拡大表示
const body = document.querySelector('body');
body.insertAdjacentHTML('afterend', '<div id="modal-container"><div><img src=""></div></div>')
const modal = document.querySelector('#modal-container');
modal.addEventListener('click', () => modal.style.display = 'none');
const img = modal.querySelector('img');
document.querySelectorAll('.popup img').forEach(function (elem) {
	elem.addEventListener('click', () => {
		img.src = elem.src;
		modal.style.display = 'block';
	})
});
//ヘッダー
const div = document.querySelector('.contents');
div.insertAdjacentHTML('afterbegin', ' <header><div class="header"><a class="area" href="/index.html"></a><i class="fas fa-ghost"></i><div><h1>HAGURE YOUMA&#39;S HIDEOUT</h1><p>はぐれヨウマの隠れ家</p></div><i class="fas fa-ghost"></i></div></header>');
//フッター
if (window.location.pathname.split("/").pop() !== "index.html") {
	div.insertAdjacentHTML('beforeend', '<footer><hr><a href="/index.html" target="_top">ホームへ戻る</a></footer>');
}

//もくじ自動生成
const hs = document.querySelectorAll('h2');
if (hs.length > 0) {
	let cont = '';
	hs.forEach((h, i) => {
		cont += `<li><a href="#head${i}">${h.textContent}</a></li>`;
		h.insertAdjacentHTML('afterbegin', `<a id="head${i}"></a>`);
	});
	document.querySelector('nav').innerHTML = `<div class="menu"><h3 class="head">目次</h3><ul>${cont}</ul></div>`;
}