// 내비게이션 경로 탐색 상태를 관리하는 전역 변수입니다.
let isNavigating = false;
// 출발지와 도착지 정보를 저장하는 전역 상태 객체입니다.
let routeState = {
    start: null, // 출발지 좌표 (kakao.maps.LatLng)
    end: null,   // 도착지 좌표 (kakao.maps.LatLng)
};

/**
 * [목적]
 * 서버(FAST API)와 통신하여 최단거리 경로 데이터를 가져오고,
 * 데이터 구조의 유효성을 검사한 후 지도에 시각화 및 정보를 송출합니다.
 */
async function runNavigation() {
    // 출발지와 도착지가 모두 설정되었는지 확인합니다.
    if (!routeState.start || !routeState.end) {
        // 조건이 충족되지 않으면 콘솔에 경고를 출력하고 함수를 종료합니다.
        console.warn("출발지 또는 도착지가 설정되지 않았습니다.");
        // 함수 실행을 중단합니다.
        return;
    }

    // 현재 내비게이션이 실행 중인지 확인합니다.
    if (isNavigating) {
        // 이미 실행 중이라면 경고를 출력하고 함수를 종료합니다.
        console.warn("이미 경로 탐색이 진행 중입니다.");
        // 함수 실행을 중단합니다.
        return;
    }

    // 내비게이션 상태를 '실행 중'으로 변경합니다. (로딩 UI 활성화 등에 사용)
    isNavigating = true;

    // 기존에 그려진 마커와 라인을 지웁니다.
    clearMarker();
    clearMapLines();

    // 서버로 보낼 데이터를 준비합니다.
    const routeData = {
        startX: routeState.start.getLng(), // 출발지 경도
        startY: routeState.start.getLat(), // 출발지 위도
        endX: routeState.end.getLng(),     // 도착지 경도
        endY: routeState.end.getLat(),       // 도착지 위도
    };

    try {
        // [보안] 클라이언트에서 직접 Kakao API를 호출하지 않고, 내부 서버 API(/api/route)를 통해 요청합니다.
        // fetch를 사용하여 서버에 POST 요청을 보냅니다.
        const response = await fetch('/api/route', {
            method: 'POST', // HTTP 메소드는 POST 입니다.
            headers: {
                'Content-Type': 'application/json', // 요청 본문의 타입은 JSON 입니다.
            },
            body: JSON.stringify(routeData), // JavaScript 객체를 JSON 문자열로 변환하여 전송합니다.
        });

        // 서버로부터 받은 응답을 JSON 형태로 파싱합니다.
        const res = await response.json();

        // 응답 데이터에서 경로 정보(routes)가 유효한지 확인합니다.
        if (res && res.routes && res.routes.length > 0) {
            // 첫 번째 경로의 첫 번째 구간(section) 정보를 구조 분해 할당으로 가져옵니다.
            const { distance, duration, sections } = res.routes[0].sections[0];
            
            // 경로 좌표 데이터가 있는지 확인합니다.
            if (sections && sections.length > 0) {
                // 경로를 그릴 좌표들을 담을 배열을 생성합니다.
                const linePath = [];
                // 모든 구간(section)을 순회합니다.
                sections.forEach(s => {
                    // 각 구간의 도로(road) 정보를 순회합니다.
                    s.roads.forEach(road => {
                        // 도로를 구성하는 좌표들을 순회합니다.
                        for (let i = 0; i < road.vertex.length; i += 2) {
                            // 좌표 쌍(x, y)을 kakao.maps.LatLng 객체로 변환하여 배열에 추가합니다.
                            linePath.push(new kakao.maps.LatLng(road.vertex[i+1], road.vertex[i]));
                        }
                    });
                });

                // 지도에 경로를 표시할 Polyline을 생성합니다.
                currentPolyline = new kakao.maps.Polyline({
                    path: linePath,           // Polyline을 구성하는 좌표 배열입니다.
                    strokeWeight: 5,          // 선의 두께입니다.
                    strokeColor: '#FF0000',   // 선의 색상입니다.
                    strokeOpacity: 0.7,       // 선의 불투명도입니다.
                    strokeStyle: 'solid'      // 선의 스타일입니다.
                });

                // 생성된 Polyline을 지도에 표시합니다.
                currentPolyline.setMap(window.kakaoMap);

                // [UI 갱신] 화면에 거리와 시간 정보를 표시합니다. (구현 필요)
                // 예: document.getElementById('distance').innerText = `${(distance / 1000).toFixed(2)} km`;
                // 예: document.getElementById('duration').innerText = `${Math.round(duration / 60)} 분`;
            }
        } else {
            // 유효한 경로 정보가 없을 경우 에러를 출력합니다.
            console.error('경로 데이터를 받지 못했습니다.', res);
        }
    } catch (error) {
        // API 통신 중 에러가 발생하면 콘솔에 에러를 출력합니다.
        console.error('경로 탐색 중 에러 발생:', error);
    } finally {
        // 내비게이션 상태를 '종료'로 변경합니다. (로딩 UI 비활성화 등)
        isNavigating = false;
    }
}


/**
 * [목적]
 * 사용자가 선택한 지점(출발/도착)의 좌표를 검증하여 저장하고,
 * 제어권(options)에 따라 내비게이션 실행 여부를 결정합니다.
 * @param {'start' | 'end'} type - 지점의 유형 ('start' 또는 'end')
 * @param {kakao.maps.LatLng} latlng - 카카오맵의 LatLng 객체
 * @param {object} options - 추가 옵션 객체 (예: { autoRun: boolean })
 * @returns {object} - 업데이트된 전체 routeState 객체를 반환합니다.
 */
function setLocation(type, latlng, options = { autoRun: true }) {
    // latlng이 유효한 kakao.maps.LatLng 객체인지 확인합니다. (Guard Clause)
    if (!latlng || typeof latlng.getLat !== 'function' || typeof latlng.getLng !== 'function') {
        // 유효하지 않은 경우 콘솔에 에러를 출력하고 함수를 종료합니다.
        console.error("유효하지 않은 좌표 객체입니다.");
        // 현재 routeState를 반환합니다.
        return routeState;
    }

    // [검증] 좌표가 대전 시청 기준 일정 반경 내인지 검사할 수 있습니다. (선택적 구현)
    // const daejeonCityHall = new kakao.maps.LatLng(36.3504, 127.3845);
    // const distance = polyline.getDistance(daejeonCityHall, latlng);
    // if (distance > 20000) { // 20km 이상 벗어난 경우
    //     alert("서비스 지역(대전)을 벗어난 좌표입니다.");
    //     return routeState;
    // }

    // type에 따라 출발지 또는 도착지 좌표를 `routeState`에 저장합니다.
    if (type === 'start') {
        // 출발지 좌표를 업데이트합니다.
        routeState.start = latlng;
    } else if (type === 'end') {
        // 도착지 좌표를 업데이트합니다.
        routeState.end = latlng;
    }

    // // TODO: map.js의 마커 업데이트 함수를 호출하여 핀을 표시해야 합니다.
    // // 예: updateMarker(type, latlng);

    // 옵션의 autoRun이 true이고, 출발지와 도착지가 모두 설정되었을 경우에만 내비게이션을 실행합니다.
    if (options.autoRun && routeState.start && routeState.end) {
        // runNavigation 함수를 호출하여 경로 탐색을 시작합니다.
        runNavigation();
    }

    // 업데이트된 routeState 객체를 반환합니다.
    return routeState;
}
