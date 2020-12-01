import { ARLoader } from "./ARLoader.js";

class ARButton {

	static createButton( page, filename, sessionInit = {} ) {

		const button = document.createElement( 'button' );
		const divQRCode = document.getElementById("qrcode");
		document.body.removeChild(divQRCode);
		let qrVisibility = false;
		var webGlView = document.getElementById('webGLView');

		function showStartAR( /*device*/ ) {

			let currentSession = null;

			function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				webGlView.parentNode.removeChild(webGlView);

				const renderer = ARLoader.createARLoader(filename);

				renderer.xr.setReferenceSpaceType( 'local' );
				renderer.xr.setSession( session );
				button.textContent = 'STOP AR';

				currentSession = session;
			}

			function onSessionEnded( /*event*/ ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				button.textContent = 'START AR';

				currentSession = null;

				document.location.href='';
			}

			//

			button.style.display = '';

			button.textContent = 'START AR';

			button.onmouseenter = function () {

				button.style.opacity = '1.0';

			};

			button.onmouseleave = function () {

				button.style.opacity = '0.5';

			};

			button.onclick = function () {

				if ( currentSession === null ) {

					navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

				} else {

					currentSession.end();

				}

			};

		}

		function displayModale(){
			qrVisibility = !qrVisibility;
			if (qrVisibility){
				divQRCode.style.visibility = "visible";
			} else {
				divQRCode.style.visibility = "hidden";
			}
		}

		function showARNotSupported() {
			document.body.appendChild(divQRCode);
			button.style.display = '';

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = displayModale;
			button.textContent = 'VIEW IN AR';
			webGlView.appendChild(button);
		}

		if ( 'xr' in navigator ) {

			button.id = 'ARButton';
			button.style.display = 'none';

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( function ( supported ) {

				supported ? showStartAR() : showARNotSupported();

			} ).catch( showARNotSupported );

			return button;

		} else {

			const message = document.createElement( 'a' );

			if ( window.isSecureContext === false ) {

				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS'; // TODO Improve message

			} else {

				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';

			}

			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';

			stylizeElement( message );

			return message;

		}

	}

}

export { ARButton };
