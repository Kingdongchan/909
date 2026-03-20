// 내비게이션 경로 탐색 상태를 관리하는 전역 변수입니다.
let isNavigating = false;
// 출발지와 도착지 정보를 저장하는 전역 상태 객체입니다.
let routeState = {
    start: null, // 출발지 좌표 (kakao.maps.LatLng)
    end: null,   // 도착지 좌표 (kakao.maps.LatLng)
};

/**
 * [기능] 사용자가 UI에서 입력한 출발지 및 도착지 주소를 기반으로 경로 탐색을 시작합니다.
 * 이 함수는 '경로 검색 하기' 버튼 클릭 시 호출됩니다.
 *
 * [흐름]
 * 1. UI의 'origin'과 'destination' 입력 필드에서 주소 값을 가져옵니다.
 * 2. 두 주소 중 하나라도 비어 있으면 사용자에게 경고 메시지를 표시하고 함수 실행을 중단합니다.
 * 3. 각 주소에 대해 `getCoordsForAddress` 함수를 호출하여 백엔드를 통해 좌표를 비동기적으로 가져옵니다.
 * 4. 주소에 대한 좌표를 찾을 수 없으면 사용자에게 경고 메시지를 표시하고 함수 실행을 중단합니다.
 * 5. 변환된 출발지 및 도착지 좌표를 `setLocation` 함수에 전달하여 전역 `routeState`를 업데이트합니다.
 *    이때, 도착지 좌표 설정 시 `autoRun: true` 옵션을 통해 `runNavigation` 함수가 자동으로 호출되도록 합니다.
 */
async function searchRoute() {
    // 1. UI 입력 필드에서 출발지와 도착지 주소 가져오기
    const originAddress = document.getElementById('origin').value;
    const destinationAddress = document.getElementById('destination').value;

    // 2. 주소 유효성 검사
    if (!originAddress || !destinationAddress) {
        alert("출발지와 도착지를 모두 입력해주세요.");
        return;
    }

    // 3. 출발지 주소를 좌표로 변환 (백엔드 /api/geocode 호출)
    const originCoords = await getCoordsForAddress(originAddress);
    if (!originCoords) {
        alert("출발지 주소를 찾을 수 없습니다.");
        return;
    }

    // 4. 도착지 주소를 좌표로 변환 (백엔드 /api/geocode 호출)
    const destinationCoords = await getCoordsForAddress(destinationAddress);
    if (!destinationCoords) {
        alert("도착지 주소를 찾을 수 없습니다.");
        return;
    }

    // 5. 변환된 좌표를 `routeState`에 설정하고, 마지막 설정에서 경로 탐색(`runNavigation`)을 자동 실행
    // 출발지 설정 시에는 `runNavigation`이 자동으로 실행되지 않도록 `autoRun: false`로 설정합니다.
    setLocation('start', originCoords, { autoRun: false });
    // 도착지 설정 시에는 `runNavigation`이 자동으로 실행되도록 `autoRun: true`로 설정합니다.
    // `setLocation` 내부 로직에 따라 출발지와 도착지가 모두 설정되면 `runNavigation`이 호출됩니다.
    setLocation('end', destinationCoords, { autoRun: true }); 
}

/**
 * [기능] 주어진 주소 문자열을 백엔드 API (`/api/geocode`)를 통해 지리적 좌표(위도, 경도)로 변환합니다.
 * 이 함수는 카카오 지도 API의 주소-좌표 변환(Geocoding) 기능을 서버를 통해 간접적으로 활용합니다.
 *
 * [흐름]
 * 1. 백엔드의 `/api/geocode` 엔드포인트로 주소 문자열을 포함한 POST 요청을 보냅니다.
 *    요청 본문은 `{"address": "주소 문자열"}` 형태의 JSON입니다.
 * 2. 서버로부터 받은 응답의 HTTP 상태 코드(response.ok)를 확인하여 성공 여부를 검증합니다.
 *    실패 시에는 에러를 발생시키고 catch 블록으로 이동합니다.
 * 3. 응답 데이터를 JSON 형태로 파싱합니다. 이 데이터에는 변환된 좌표의 위도(lat)와 경도(lng)가 포함되어야 합니다.
 * 4. 추출된 위도(lat)와 경도(lng) 정보로 `kakao.maps.LatLng` 객체를 생성하여 반환합니다.
 * 5. 주소 변환에 실패하거나 서버 응답에 유효한 좌표 정보가 없는 경우 `null`을 반환하고 콘솔에 경고 또는 에러를 기록합니다.
 * 6. 네트워크 에러 등 예외 발생 시 콘솔에 에러를 기록하고 `null`을 반환합니다.
 *
 * @param {string} address - 좌표로 변환할 주소 문자열 (예: "대전역")
 * @returns {kakao.maps.LatLng|null} - 성공적으로 변환된 카카오맵 좌표 객체 또는 주소를 찾을 수 없는 경우 `null`
 */
async function getCoordsForAddress(address) {
    try {
        const response = await fetch('/api/geocode', {
            method: 'POST', // 주소 데이터를 서버로 전송하기 위해 POST 메소드 사용
            headers: {
                'Content-Type': 'application/json', // 요청 본문이 JSON 형식임을 서버에 알림
            },
            body: JSON.stringify({ address: address }), // 주소 문자열을 JSON 형태로 직렬화하여 요청 본문에 포함
        });

        // HTTP 응답이 성공적이지 않으면 (예: 4xx, 5xx 에러) 에러 발생
        if (!response.ok) {
            throw new Error(`Geocoding API 호출에 실패했습니다. 상태: ${response.status}`);
        }

        const data = await response.json(); // 서버 응답을 JSON 형태로 파싱

        // 응답 데이터에 유효한 위도(lat) 및 경도(lng) 정보가 있는지 확인
        if (data && data.lat !== undefined && data.lng !== undefined) {
            return new kakao.maps.LatLng(data.lat, data.lng); // `kakao.maps.LatLng` 객체로 변환하여 반환
        } else {
            console.warn("Geocoding API 응답에 유효한 좌표 정보가 없습니다.", data);
            return null; // 유효한 좌표가 없는 경우 `null` 반환
        }
    } catch (error) {
        console.error("주소-좌표 변환 중 에러 발생 (Geocoding Error):", error);
        return null; // 에러 발생 시 `null` 반환
    }
}


/**
 * [기능] 설정된 출발지와 도착지 좌표를 기반으로 서버와 통신하여 최단 경로 데이터를 가져오고, 지도에 시각화합니다.
 * 이 함수는 `setLocation` 함수에서 `autoRun: true`가 설정되었을 때, 출발지와 도착지가 모두 채워지면 자동으로 호출됩니다.
 *
 * [흐름]
 * 1. `routeState`에 출발지 또는 도착지 좌표가 없으면 경고 메시지를 출력하고 함수 실행을 중단합니다.
 * 2. `isNavigating` 플래그를 통해 현재 다른 경로 탐색이 진행 중인지 확인하고, 중복 실행을 방지합니다.
 * 3. 내비게이션 상태를 '실행 중'(`isNavigating = true`)으로 변경하고, 이전 경로 표시를 위해 지도상의 모든 마커와 경로 선을 지웁니다.
 * 4. 출발지 및 도착지 좌표를 포함하는 데이터를 백엔드의 `/api/route` 엔드포인트로 POST 요청합니다.
 *    이 요청은 카카오 길찾기 API(Directions API)를 서버를 통해 호출합니다.
 * 5. 서버로부터 받은 경로 데이터를 파싱하고, 유효한 경로 정보가 있을 경우 지도에 빨간색 `Polyline`으로 경로를 그립니다.
 * 6. 경로가 성공적으로 그려진 후, `category.js` 파일의 `coordinateInsert()` 함수를 호출하여 해당 경로 주변의 상점 데이터를 자동으로 가져오도록 연동합니다.
 *    이것이 `navigation.js`와 `category.js`를 연결하는 핵심적인 부분입니다.
 * 7. 경로 탐색 중 에러 발생 시 콘솔에 기록하고 사용자에게 알림을 제공하며, `isNavigating` 상태를 '종료'로 되돌립니다.
 */
async function runNavigation() {
    // 1. 출발지 또는 도착지 유효성 검사: 경로 탐색 시작 전에 필수 좌표가 모두 설정되었는지 확인
    if (!routeState.start || !routeState.end) {
        console.warn("경로 탐색 시작 실패: 출발지 또는 도착지가 설정되지 않았습니다.");
        return;
    }

    // 2. 중복 실행 방지: 현재 다른 경로 탐색 작업이 진행 중이라면 새 요청을 막음
    if (isNavigating) {
        console.warn("경로 탐색 중: 이미 경로 탐색이 진행 중이므로 새로운 요청을 무시합니다.");
        return;
    }

    // 3. 내비게이션 상태 변경 및 지도 초기화: 로딩 UI 활성화 등을 위해 플래그 설정 및 이전 지도 요소 제거
    isNavigating = true; // 내비게이션 시작 플래그 설정
    clearMarker();      // map.js에 정의된 함수로 지도상의 모든 마커를 제거
    clearMapLines();    // map.js에 정의된 함수로 지도상의 모든 경로 선을 제거

    // 4. 서버로 보낼 경로 데이터 준비: Kakao 길찾기 API의 요구사항에 맞춰 출발지/도착지 좌표를 구성
    const routeData = {
        startX: routeState.start.getLng(), // 출발지 경도 (Longitude)
        startY: routeState.start.getLat(), // 출발지 위도 (Latitude)
        endX: routeState.end.getLng(),     // 도착지 경도
        endY: routeState.end.getLat(),       // 도착지 위도
    };

    try {
        // 5. 백엔드 `/api/route` 엔드포인트에 최단 경로 요청: 서버를 통해 Kakao 길찾기 API 호출
        // 클라이언트에서 직접 Kakao API 키를 노출하지 않기 위해 백엔드를 프록시로 사용합니다.
        const response = await fetch('/api/route', {
            method: 'POST', // 경로 정보를 요청하기 위해 POST 메소드 사용
            headers: { 'Content-Type': 'application/json' }, // 요청 본문이 JSON임을 명시
            body: JSON.stringify(routeData), // JavaScript 객체를 JSON 문자열로 변환하여 전송
        });

        // HTTP 응답이 성공적이지 않으면 에러 발생
        if (!response.ok) {
            throw new Error(`경로 API 호출 실패. 상태: ${response.status}`);
        }

        const res = await response.json(); // 서버 응답을 JSON 형태로 파싱

        // 6. 응답 데이터에서 경로 정보 확인 및 지도에 그리기
        // Kakao 길찾기 API 응답 구조에 따라 `routes` 배열 내에 경로 정보가 있는지 확인합니다.
        if (res && res.routes && res.routes.length > 0) {
            // 첫 번째 경로의 첫 번째 구간(section) 정보를 가져옵니다.
            const { sections } = res.routes[0].sections[0]; 

            if (sections && sections.length > 0) {
                const linePath = [];
                // 각 구간(section)과 도로(road)를 순회하며 경로를 구성하는 모든 좌표를 추출합니다.
                sections.forEach(s => {
                    s.roads.forEach(road => {
                        // Kakao API는 좌표를 [경도, 위도, 경도, 위도, ...] 형태로 제공하므로 2개씩 묶어 처리
                        for (let i = 0; i < road.vertex.length; i += 2) {
                            linePath.push(new kakao.maps.LatLng(road.vertex[i+1], road.vertex[i]));
                        }
                    });
                });

                // 지도에 경로를 시각화하는 Polyline 객체 생성
                currentPolyline = new kakao.maps.Polyline({
                    path: linePath,           // Polyline을 구성하는 좌표 배열
                    strokeWeight: 5,          // 선의 두께 (픽셀)
                    strokeColor: '#FF0000',   // 선의 색상 (빨간색)
                    strokeOpacity: 0.7,       // 선의 불투명도
                    strokeStyle: 'solid'      // 선의 스타일
                });
                currentPolyline.setMap(window.kakaoMap); // 생성된 Polyline을 지도에 표시

                // 7. 경로 탐색 완료 후, `coordinateInsert()` 호출하여 주변 상점 정보 자동으로 가져오기
                // 이 호출을 통해 navigation.js와 category.js 간의 유기적 결합이 이루어집니다.
                // 경로가 지도에 그려진 직후, 해당 경로 주변의 상점 데이터를 백엔드로부터 조회하도록 트리거합니다.
                coordinateInsert();

                // [TODO: UI 갱신] 화면에 거리와 시간 정보를 표시하는 로직 추가 필요
                // 예: document.getElementById('distance').innerText = `${(distance / 1000).toFixed(2)} km`;
                // 예: document.getElementById('duration').innerText = `${Math.round(duration / 60)} 분`;
            } else {
                console.warn('경로 API 응답에 유효한 구간(section) 정보가 없습니다.');
                alert("경로를 구성하는 상세 정보를 찾을 수 없습니다.");
            }
        } else {
            console.error('경로 API로부터 유효한 경로 데이터를 받지 못했습니다.', res);
            alert("요청하신 경로를 찾을 수 없습니다. 출발지와 도착지를 다시 확인해주세요.");
        }
    } catch (error) {
        console.error('경로 탐색 중 에러 발생:', error);
        alert("경로 탐색 중 네트워크 또는 서버 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
        isNavigating = false; // 내비게이션 종료 플래그 해제 (로딩 UI 비활성화 등)
    }
}


/**
 * [기능] 사용자가 선택한 지점(출발/도착)의 좌표를 `routeState` 전역 객체에 저장하고,
 * `options.autoRun` 설정에 따라 `runNavigation` 함수를 자동으로 실행할지 결정합니다.
 *
 * [흐름]
 * 1. 전달받은 `latlng` 객체가 유효한 `kakao.maps.LatLng` 객체인지 확인합니다. 유효하지 않으면 에러를 기록하고 현재 상태를 반환합니다.
 * 2. `type` 매개변수('start' 또는 'end')에 따라 `latlng` 값을 `routeState.start` 또는 `routeState.end`에 저장합니다.
 * 3. (TODO) `map.js`의 함수를 호출하여 지도에 출발/도착 마커를 표시하는 로직을 추가할 수 있습니다.
 * 4. `options.autoRun`이 `true`이고, `routeState.start`와 `routeState.end`가 모두 유효한 좌표를 가지고 있을 경우에만 `runNavigation` 함수를 호출하여 경로 탐색을 시작합니다.
 * 5. 업데이트된 `routeState` 객체를 반환합니다.
 *
 * @param {'start' | 'end'} type - 설정할 지점의 유형 ('start' 또는 'end').
 * @param {kakao.maps.LatLng} latlng - 카카오맵의 `LatLng` 객체 (위도, 경도).
 * @param {object} options - 추가 옵션 객체.
 * @param {boolean} [options.autoRun=true] - `true`로 설정되면 출발지와 도착지가 모두 설정되었을 때 `runNavigation`을 자동 호출합니다. 기본값은 `true`.
 * @returns {object} - 업데이트된 `routeState` 객체를 반환합니다.
 */
function setLocation(type, latlng, options = { autoRun: true }) {
    // `latlng` 객체가 유효한지 확인 (카카오맵 LatLng 객체는 `getLat`, `getLng` 메소드를 가짐)
    if (!latlng || typeof latlng.getLat !== 'function' || typeof latlng.getLng !== 'function') {
        console.error("setLocation 함수에 유효하지 않은 좌표 객체가 전달되었습니다.");
        return routeState;
    }

    // `type`에 따라 출발지 또는 도착지 좌표를 `routeState` 전역 변수에 저장
    if (type === 'start') {
        routeState.start = latlng;
    } else if (type === 'end') {
        routeState.end = latlng;
    }

    // TODO: map.js의 마커 업데이트 함수를 호출하여 지도에 출발/도착 핀을 표시하는 로직 추가 필요.
    // 예: `updateMarker(type, latlng);` - 이 함수는 map.js에 정의되어야 합니다.

    // `autoRun` 옵션이 `true`이고, 출발지 및 도착지 좌표가 모두 설정되었을 경우 `runNavigation` 자동 실행
    // 이 조건을 통해 두 좌표가 모두 설정된 후에만 경로 탐색이 시작되도록 보장합니다.
    if (options.autoRun && routeState.start && routeState.end) {
        runNavigation();
    }

    return routeState; // 업데이트된 `routeState` 반환
}
