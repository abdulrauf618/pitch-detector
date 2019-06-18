        function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
            navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
        }

        var mediaConstraints = {
            audio: true
        };

        var mediaRecorder;

        var audiosContainer = document.getElementById('audios-container');
        var index = 1;

        
        document.querySelector('#start-recording').onclick = function() {
            console.log('clicked on start-recording');
            this.disabled = true;
            $('#play-recording').prop('disabled', true);
            $('#audios-container').html('');
            captureUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
        };

        document.querySelector('#stop-recording').onclick = function() {
            console.log('clicked on stop-recording');
            this.disabled = true;            
            mediaRecorder.stop();
            mediaRecorder.stream.stop();

            document.querySelector('#start-recording').disabled = false;
            $('#play-recording').prop('disabled', false);

            // setTimeout(function(){
            // 	console.log('play recording');
            // 	$('#play-recording').click();//play toggle
            // },300);
            
            $('#audios-container audio').remove();
        };

        document.querySelector('#save-recording').onclick = function() {
            console.log('clicked on save-recording');
            this.disabled = true;
            mediaRecorder.save();

            // alert('Drop WebM file on Chrome or Firefox. Both can play entire file. VLC player or other players may not work.');
        };
        

        function onMediaSuccess(stream) {
            var audio = document.createElement('audio');

            audio = mergeProps(audio, {
                controls: true,
                muted: false,
            });
            audio.srcObject = stream;
            audio.play();

            audiosContainer.appendChild(audio);
            audiosContainer.appendChild(document.createElement('hr'));


            console.log('on media success');
            mediaRecorder = new MediaStreamRecorder(stream);
            mediaRecorder.stream = stream;
            mediaRecorder.recorderType = StereoAudioRecorder;
            mediaRecorder.mimeType = 'audio/wav';

            mediaRecorder.audioChannels = 1;
            mediaRecorder.ondataavailable = function(blob) {
                var a = document.createElement('a');
                a.target = '_blank';
                a.innerHTML = 'Open Recorded Audio No. ' + (index++) + ' (Size: ' + bytesToSize(blob.size) + ')';//' Time Length: ' + getTimeLength(timeInterval);

                a.href = URL.createObjectURL(blob);

                audiosContainer.appendChild(a);
                audiosContainer.appendChild(document.createElement('hr'));
                
                // document.getElementById("blob").value = blob;
                // document.getElementById("form1").submit();


                uploadToServer(blob);
            };

            var timeInterval = document.querySelector('#time-interval').value;
            if (timeInterval) timeInterval = parseInt(timeInterval);
            else timeInterval = 60 * 1000;

            // get blob after specific time interval
            mediaRecorder.start(timeInterval);

            document.querySelector('#stop-recording').disabled = false;
            document.querySelector('#save-recording').disabled = false;
        }

        function onMediaError(e) {
            console.error('media error', e);
        }


        // below function via: http://goo.gl/B3ae8c
        function bytesToSize(bytes) {
            var k = 1000;
            var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) return '0 Bytes';
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
        }

        // below function via: http://goo.gl/6QNDcI
        function getTimeLength(milliseconds) {
            var data = new Date(milliseconds);
            return data.getUTCHours() + " hours, " + data.getUTCMinutes() + " minutes and " + data.getUTCSeconds() + " second(s)";
        }

        window.onbeforeunload = function() {
            document.querySelector('#start-recording').disabled = false;
        };

        function uploadToServer(blob) {
        	console.log('uploadToPHPServer', blob);

        	let fileReader = new FileReader();
			fileReader.onloadend = () => {				
			    audioContext.decodeAudioData( fileReader.result, function(buffer) {
		    		lastRecordingBuffer = buffer;
                    theBuffer = lastRecordingBuffer;
		  		}, function(){alert("error loading!");} ); 
			}

			fileReader.readAsArrayBuffer(blob);

        	
            var file = new File([blob], 'msr-' + (new Date).toISOString().replace(/:|\./g, '-') + '.wav', {
                type: 'audio/wav'
            });

            return; // If server has no node js server, then do not do this below work
            // create FormData
            var formData = new FormData();
            formData.append('audio_filename', file.name);
            formData.append('audio_blob', file);
            var uploadURL = 'http://localhost:8080/audio-pitch';
            
            $.ajax({
	            url: uploadURL,
	            type: "POST",
	            data:formData,
	            dataType: 'jsonp',
	            processData: false,
	            contentType: false,
	            success: function(data) {
                    console.log(data);
                    var dataHTML = '';
                    for(var i=0; i<data.length; i++){
                     	dataHTML += data[i]+' Hz at '+i+' sec';
                 	}
                 	$('#pitchOfLastAudio').html(dataHTML);
	            }
            });
        }

        function makeXMLHttpRequest(url, data, callback) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if (request.readyState == 4 && request.status == 200) {
                    callback();
                }
            };
            request.open('POST', url);
            request.send(data);
        }