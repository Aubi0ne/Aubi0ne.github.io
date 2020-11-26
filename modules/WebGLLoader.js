import * as THREE from 'https://unpkg.com/three@0.122.0/build/three.module.js';

import { OrbitControls } from 'https://unpkg.com/three@0.122.0/examples/jsm/controls/OrbitControls.js';;
import { GLTFLoader } from 'https://unpkg.com/three@0.122.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.122.0/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'https://unpkg.com/three@0.122.0/examples/jsm/utils/RoughnessMipmapper.js';

class WebGLLoader {

	static createWebGLLoader( model ) {
		const container = document.createElement('div');
		container.id = "webGLView";
		container.style="position: relative;";
		document.body.appendChild(container);

		let camera, scene, renderer;

		init();
		render();

		function init() {
			camera = new THREE.PerspectiveCamera(45, parent.innerWidth / parent.innerHeight, 0.25, 20);
			camera.position.set(- 1.8, 0.6, 2.7);

			scene = new THREE.Scene();
			scene.background = new THREE.Color( 0xffffff );

			const light = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
			light.position.set( 0.5, 1, 0.25 );
            scene.add( light );

			new RGBELoader()
				.setDataType(THREE.UnsignedByteType)
				.setPath('textures/equirectangular/')
				.load('royal_esplanade_1k.hdr', function (texture) {

					const envMap = pmremGenerator.fromEquirectangular(texture).texture;

					//scene.background = envMap;
					//scene.environment = envMap;

					texture.dispose();
					pmremGenerator.dispose();

					render();

					// model

					// use of RoughnessMipmapper is optional
					const roughnessMipmapper = new RoughnessMipmapper(renderer);

					const loader = new GLTFLoader().setPath('models/gltf/');
					loader.load(model + ".gltf", function (gltf) {

						gltf.scene.traverse(function (child) {

							if (child.isMesh) {

								// TOFIX RoughnessMipmapper seems to be broken with WebGL 2.0
								// roughnessMipmapper.generateMipmaps( child.material );

							}

						});
						//gltf.scene.positon.set(0,0,0);
						//gltf.scene.scale.set(1.5,1.5,1.5);
						scene.add(gltf.scene);

						roughnessMipmapper.dispose();

						render();

					});

				});

			renderer = new THREE.WebGLRenderer({ antialias: true });
			renderer.setPixelRatio(window.devicePixelRatio);
			console.log(parent.innerWidth, parent.innerHeight);
			renderer.setSize(parent.innerWidth, parent.innerHeight);
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1;
			renderer.outputEncoding = THREE.sRGBEncoding;
			container.appendChild(renderer.domElement);
			console.log(navigator.userAgent);

			const pmremGenerator = new THREE.PMREMGenerator(renderer);
			pmremGenerator.compileEquirectangularShader();

			const controls = new OrbitControls(camera, renderer.domElement);
			controls.addEventListener('change', render); // use if there is no animation loop
			controls.minDistance = 2;
			controls.maxDistance = 10;
			controls.target.set(0, 0, 0);
			controls.update();

			window.addEventListener('resize', onWindowResize, false);
			console.log(parent.innerWidth, parent.innerHeight);

		}

		function onWindowResize() {
			console.log(parent.innerWidth, parent.innerHeight);

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize(parent.innerWidth, parent.innerHeight);

			render();

		}

		//

		function render() {
			renderer.render(scene, camera);
		}

		return container;
	}
}
export { WebGLLoader };