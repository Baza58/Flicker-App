require('./style.scss');

const app = (function() {
	
	const content = document.querySelector('.images-container');
	const form = document.querySelector('.form');
	const input = document.querySelector('.form-input');
	const moreBtn = document.querySelector('.more-btn');
	const modalImg = document.querySelector('.modal-img');
	const modal = document.querySelector('.modal');
	const nextBtn = document.querySelector('.next');
	const prevBtn = document.querySelector('.prev');
	const loadingImg = document.querySelector('.loading-img');
	const startImg = document.querySelector('.start-loading-img');
	const modalContainer = document.querySelector('.modal-container');
	const loadMoreImg = document.querySelector('.load-more-img');
	let page = 1;
	let searchTag;
	let nextImgSrc;
	let prevImgSrc;
	let clickedImg;

	function init() {
		form.addEventListener('submit', onFormSubmit);
		moreBtn.addEventListener('click', e => {
			// display loading img and hide the more content button
			loadMoreImg.style.display = 'initial';
			moreBtn.style.display = 'none';
			getData(null, true);
		});
		modal.addEventListener('click', hideModal);
		nextBtn.addEventListener('click', nextImg);
		prevBtn.addEventListener('click', prevImg);
	}

	function onFormSubmit(e) {
		e.preventDefault();
		const tag = input.value;
		if (!tag) return;
		// display loader
		startImg.style.display = 'initial';
		// set searchTag var to input value to use it later when fetching more posts with the same tag
		searchTag = tag;
		input.value = '';
		input.focus();
		// fetch the data
		getData(tag)
	}

	function getData(tag = searchTag, update = false) {
		fetch(`https://api.flickr.com/services/rest/?method=flickr.photos.search&tags=${tag}&format=json&api_key=c9fec50997fbb7aaa6bba68f7b62c75e&content_type=1&nojsoncallback=1&per_page=10&page=${page}`)
					.then(response => response.json())
					.then(response => processData(response, update))
					.catch(err => console.error(err));
	}

	function processData(data, update) {
		// if data is not pagination then remove all images
		if (!update) {
			while(content.firstChild) {
				content.removeChild(content.firstChild);
			}
		}
		// set page variable for future pagination fetching
		page = data.photos.page + 1;
		const nodes = data.photos.photo.map(photo => {
			const container = document.createElement('div');
			container.classList.add('img-container');
			const img = document.createElement('img');
			const src = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_m.jpg`;
			const bigSrc = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_c.jpg`;
			img.src = src;
			// construct new image and wait until it loads anf then set the opacity to 1 to have a fadein effect
			const image = new Image();
			image.src = src;
			image.onload = function () {
				container.style.opacity = '1';
			}
			container.appendChild(img);
			// set opacity by default to 0 to have that fadein effect
			container.style.opacity = '0';
			container.addEventListener('click', e => {
				showModal(e, bigSrc);
			});
			return container;
		});
		renderPhotos(nodes, update);
	}

	function renderPhotos(nodes, update = false) {
		nodes.map(node => {
			content.appendChild(node);
		});	
		// hide loader image and show pagination button
		startImg.style.display = 'none';
		moreBtn.style.display = 'initial';
		// if the rendering is updating pagination then set img to show in modal when user clicks the image
		if (update) {
			loadMoreImg.style.display = 'none';
			moreBtn.style.display = 'initial';
			setImg();
		}
	}

	function showModal(event, src) {
		if(prevBtn.hasAttribute('disabled')) {
			prevBtn.removeAttribute('disabled');
		}
		if(nextBtn.hasAttribute('disabled')) {
			nextBtn.removeAttribute('disabled');
		}
		// wait for animation frame to have the modal fadein
		requestAnimationFrame(() => {
			modal.style.display = 'flex';
		});
		requestAnimationFrame(() => {
			modal.style.opacity = '1';
		});
		loadingImg.style.display = 'initial';
		// hide the image in modal to have a fadein when image is loaded
		modalImg.style.display = 'none';
		const image = new Image();
		image.onload = function () {
			modalImg.style.display = 'initial';
			loadingImg.style.display = 'none';
		}
		image.src = src;
		// set modal image source to the src passed in
		modalImg.src = src;
		// set clickedImg variable to clicked image to setup have next and previous buttons work
		clickedImg = event.target;

		modal.style.display = 'flex';
		// set prev and next nodes
		setImg();
	}

	function nextImg(e) {
		if(prevBtn.hasAttribute('disabled')) {
			prevBtn.removeAttribute('disabled');
		}
		modalImg.style.webkitFilter = 'blur(5px) grayscale(50%)';
		loadingImg.style.display = 'initial';

		const image = new Image();
		image.onload = function () {
			modalImg.style.webkitFilter = '';
			loadingImg.style.display = 'none';
		}
		image.src = nextImgSrc;
		// set clickedImg to next image node
		clickedImg = clickedImg.parentNode.nextElementSibling.firstChild;

		modalImg.src = nextImgSrc;
		// set prev and next nodes
		setImg();
	}

	function prevImg(e) {
		if(nextBtn.hasAttribute('disabled')) {
			nextBtn.removeAttribute('disabled');
		}
		
		loadingImg.style.display = 'initial';
		modalImg.style.webkitFilter = 'blur(5px) grayscale(50%)';
		
		const image = new Image();
		image.onload = function () {
			loadingImg.style.display = 'none';
			modalImg.style.webkitFilter = '';
		}
		image.src = prevImgSrc;
		// set clickedImg to previous image node
		clickedImg = clickedImg.parentNode.previousElementSibling.firstChild;
		modalImg.src = prevImgSrc;
		// set prev and next nodes
		setImg();
	}

	function setImg() {
		// if the clicked image is the first node then set only the next image node
		if (clickedImg.parentNode.previousElementSibling === null) {
			prevBtn.setAttribute('disabled', 'disabled');
			const next = clickedImg.parentNode.nextElementSibling.firstChild.src;
			// get url to the same image but with bigger resolution
			nextImgSrc = next.replace(/_m.jpg/gi, '_c.jpg'); 
			return;
		}
		// if the clicked image is the last node then set only the previous image node and fetch additional images
		if (clickedImg.parentNode.nextElementSibling === null) {
			getData(null, true);
			// nextBtn.setAttribute('disabled', 'disabled');
			const prev = clickedImg.parentNode.previousElementSibling.firstChild.src;	
			prevImgSrc = prev.replace(/_m.jpg/gi, '_c.jpg'); 
			return;
		}

		const next = clickedImg.parentNode.nextElementSibling.firstChild.src;
		const prev = clickedImg.parentNode.previousElementSibling.firstChild.src;
		nextImgSrc = next.replace(/_m.jpg/gi, '_c.jpg'); 
		prevImgSrc = prev.replace(/_m.jpg/gi, '_c.jpg'); 
	}

	function hideModal(e) {
		if (e.target === modal || e.target === modalContainer) {
			modal.style.opacity = '0';	
			setTimeout(() => {
				modal.style.display = 'none';
			}, 300);
		}
	}

	return {
		init: init
	}

})();

app.init();




