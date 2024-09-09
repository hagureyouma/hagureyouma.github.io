//画像の拡大表示
const modal = document.getElementById('modal-container');
const img = modal.querySelector('img');
document.querySelectorAll('.popup img').forEach(function (elem) {
	elem.addEventListener('click', () => {
		img.src = elem.src;
		modal.style.display = 'block';
	})
});
modal.addEventListener('click', () => modal.style.display = 'none');

//もくじ自動生成
const nv = document.querySelector('nav');
const hs = document.querySelectorAll('h2');
if (hs.length > 1) {
	let cont='';
	hs.forEach((h,i)=>{
		cont+=`<li><a href="#head${i}">${h.textContent}</a></li>`;
		h.innerHTML+=`<a id="head${i}"></a>`;
	});
	nv.innerHTML=`<div class="menu"><h3 class="head">目次</h3><ul>${cont}</ul></div>`;
}