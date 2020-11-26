import * as THREE from 'https://unpkg.com/three@0.122.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.122.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.122.0/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'https://unpkg.com/three@0.122.0/examples/jsm/utils/RoughnessMipmapper.js';

class ARLoader {

    static createARLoader(filename) {
        let container;
		let camera, scene, renderer;
		let controller;

		let reticle;
		let display_art = true;
		let move_art = true;
		let model;

		let hitTestSource = null;
		let hitTestSourceRequested = false;

		init();
		animate();

		function init() {

			container = document.createElement( 'div' );
			container.style="position: relative;";
			document.body.appendChild( container );

			scene = new THREE.Scene();

			camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

			const light = new THREE.HemisphereLight( 0xffffff, 0xffffff, 1 );
			light.position.set( 0.5, 1, 0.25 );
            scene.add( light );
                
            var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
			directionalLight.position.set(1, 3, 2.5).normalize();
			scene.add(directionalLight);

			var ambientLight = new THREE.AmbientLight(0x222222);
			scene.add(ambientLight);

			renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );
			renderer.xr.enabled = true;
			container.appendChild( renderer.domElement );

			const geometry = new THREE.CylinderBufferGeometry( 0.1, 0.1, 0.2, 32 ).translate( 0, 0.1, 0 );
			const roughnessMipmapper = new RoughnessMipmapper(renderer);
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
			pmremGenerator.compileEquirectangularShader();

			function onSelect() {

				if ( reticle.visible && display_art ) {

					reticle.visible = false;
					display_art = false;
					scene.remove(reticle);

					new RGBELoader()
				    .setDataType(THREE.UnsignedByteType)
				    .setPath('textures/equirectangular/')
				    .load('royal_esplanade_1k.hdr', function(texture){

				    	let envmap = pmremGenerator.fromEquirectangular(texture).texture;
				    	scene.environment = envmap;
				    	texture.dispose();
				    	pmremGenerator.dispose();
						render();
						
						const roughnessMipmapper = new RoughnessMipmapper(renderer);
						
                        const loader = new GLTFLoader().setPath('models/gltf/');
				        loader.load(filename + ".gltf", function (gltf) {
							model = gltf.scene;
                            gltf.scene.position.setFromMatrixPosition(reticle.matrix);
							gltf.scene.visible = true;
							
							/*if (onWall){
								model.position.setFromRotationMatrix(reticle.matrix);
							}*/
							scene.add(gltf.scene);
					        roughnessMipmapper.dispose();
                            render();
                        });
					});
					
				} else {
					move_art = false;
				}
			}
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1;
			renderer.outputEncoding = THREE.sRGBEncoding;

			controller = renderer.xr.getController( 0 );
			controller.addEventListener( 'select', onSelect );
			scene.add( controller );

			reticle = new THREE.Mesh(
				new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
				new THREE.MeshBasicMaterial()
			);
			reticle.matrixAutoUpdate = false;
			reticle.visible = false;
			scene.add( reticle );

			window.addEventListener( 'resize', onWindowResize, false );

		}

		function onWindowResize() {

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize( window.innerWidth, window.innerHeight );

		}

		function animate() {

			renderer.setAnimationLoop( render );

		}

		function render( timestamp, frame ) {

			if ( frame ) {

				const referenceSpace = renderer.xr.getReferenceSpace();
				const session = renderer.xr.getSession();

				if ( hitTestSourceRequested === false ) {

					session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
						session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
							hitTestSource = source;
						} );
					} );

					session.addEventListener( 'end', function () {
						hitTestSourceRequested = false;
						hitTestSource = null;
					} );

					hitTestSourceRequested = true;

				}
				if ( hitTestSource ) {

					const hitTestResults = frame.getHitTestResults( hitTestSource );
					if ( hitTestResults.length ) {

						const hit = hitTestResults[ 0 ];

						reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
						let position = new THREE.Vector3();
						let quaternion = new THREE.Quaternion();
						let scale = new THREE.Vector3();
						reticle.matrix.decompose(position, quaternion, scale);

						if (quaternion.x != 0 || quaternion.z != 0){
							reticle.visible = true;	
						}

						if (model != undefined && move_art){
							model.position.setFromMatrixPosition(reticle.matrix);
						}

					} else {
						reticle.visible = false;
					}
				}
			}
            renderer.render( scene, camera );
		}

    	return renderer;
	}
}
export { ARLoader };