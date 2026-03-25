/**
 * @file navigation.js
 * @brief Kakao Maps API + Kakao Mobility Directions API를 활용한
 * 장소 검색, 자동완성, 실제 도로 기반 길찾기 기능을 담당합니다.
 *
 * 🔥 주요 변경 사항:
 * - Python(Folium) 로직을 JS로 변환하여 "vertexes 기반 실제 도로 경로" 구현
 * - 기존 /api/route 호출 제거 (직접 Kakao Mobility API 호출)
 * - vertex → vertexes 구조로 수정
 *
 * ⚠️ 주의:
 * - REST API 키는 프론트에 노출됨 (테스트용)
 * - 실서비스에서는 반드시 백엔드로 이동 필요
 */

// ==============================
// 🔥 전역 상태 관리
// ==============================

let isNavigating = false;

let routeState = {
    start: null,
    end: null,
};


// ==============================
// 🔥 초기화
// ==============================

function initializeNavigation() {
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');

    if (originInput && destinationInput) {
        originInput.addEventListener('keyup', (e) => searchPlaces(e.target, 'origin'));
        destinationInput.addEventListener('keyup', (e) => searchPlaces(e.target, 'destination'));
    }
}


// ==============================
// 🔥 장소 검색 (자동완성)
// ==============================

function searchPlaces(inputElement, type, retryCount = 0) {

    // Kakao services 로딩 체크
    if (typeof kakao.maps.services === 'undefined') {
        if (retryCount >= 5) {
            alert('장소 검색 로딩 실패');
            return;
        }
        setTimeout(() => searchPlaces(inputElement, type, retryCount + 1), 100);
        return;
    }

    const ps = new kakao.maps.services.Places();
    const keyword = inputElement.value;
    const container = document.getElementById(`${type}-results`);

    if (!keyword.trim()) {
        container.style.display = 'none';
        return;
    }

    ps.keywordSearch(keyword, (data, status) => {
        if (status === kakao.maps.services.Status.OK) {
            displayAutocompleteResults(data, container, type);
        } else {
            container.style.display = 'none';
        }
    });
}


// ==============================
// 🔥 자동완성 UI
// ==============================

function displayAutocompleteResults(places, container, type) {

    container.innerHTML = '';
    const ul = document.createElement('ul');

    places.forEach(place => {

        const li = document.createElement('li');

        li.innerHTML = `
            <div class="place-name">${place.place_name}</div>
            <div class="address-name">${place.road_address_name || place.address_name}</div>
        `;

        li.addEventListener('click', () => selectPlace(place, type));

        ul.appendChild(li);
    });

    container.appendChild(ul);
    container.style.display = 'block';
}


// ==============================
// 🔥 장소 선택
// ==============================

function selectPlace(place, type) {

    const input = document.getElementById(type);
    const container = document.getElementById(`${type}-results`);

    input.value = place.place_name;

    const coords = new kakao.maps.LatLng(place.y, place.x);

    if (type === 'origin') {
        routeState.start = { name: place.place_name, coords };
    } else {
        routeState.end = { name: place.place_name, coords };
    }

    container.innerHTML = '';
    container.style.display = 'none';
}


// ==============================
// 🔥 경로 검색 버튼
// ==============================

function searchRoute() {

    if (!routeState.start || !routeState.end) {
        alert("출발지와 도착지를 선택하세요");
        return;
    }

    if (document.getElementById('origin').value !== routeState.start.name) {
        alert("출발지 다시 선택");
        return;
    }

    if (document.getElementById('destination').value !== routeState.end.name) {
        alert("도착지 다시 선택");
        return;
    }

    runNavigation();
}


// ==============================
// 🚀 핵심: 길찾기 (Python → JS 변환)
// ==============================

async function runNavigation() {

    if (!routeState.start || !routeState.end) return;
    if (isNavigating) return;

    isNavigating = true;

    clearMarker();
    clearMapLines();

    // ==============================
    // 🔥 좌표 생성 (경도, 위도 순서 중요)
    // ==============================

    const origin = `${routeState.start.coords.getLng()},${routeState.start.coords.getLat()}`;
    const destination = `${routeState.end.coords.getLng()},${routeState.end.coords.getLat()}`;

    setPointMarker(routeState.start.coords, 'START');
    setPointMarker(routeState.end.coords, 'END');

    try {

        // ==============================
        // ❗❗❗ 반드시 수정해야 하는 부분 ❗❗❗
        // ==============================
        // 👉 .env는 프론트에서 못 읽는다
        // 👉 테스트용이면 직접 넣고
        // 👉 실서비스는 백엔드로 옮겨라
        // ==============================

        //TODO api 키 가릴것.
        // const KAKAO_REST_API = "9d24a7ce098f8471df6a3f1802dde837"; 

        // ==============================
        // 🔥 Kakao Mobility API 호출
        // ==============================

        const response = await fetch(
            `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `KakaoAK ${KAKAO_REST_API}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("API 호출 실패");
        }

        const data = await response.json();
        const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}&appkey=${window.KAKAO_REST_API}`;

        // ==============================
        // 🔥 Python 로직 그대로: vertexes 추출
        // ==============================

        const linePath = [];

        data.routes.forEach(route => {
            route.sections.forEach(section => {
                section.roads.forEach(road => {

                    const v = road.vertexes; // ⭐ 핵심

                    for (let i = 0; i < v.length; i += 2) {
                        linePath.push(
                            new kakao.maps.LatLng(v[i + 1], v[i])
                        );
                    }

                });
            });
        });

        // ==============================
        // 🔥 지도에 실제 도로 경로 그리기
        // ==============================

        currentPolyline = new kakao.maps.Polyline({
                path: linePath,
                strokeWeight: 6,        
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeStyle: 'solid',
            });

        currentPolyline.setMap(window.kakaoMap);

        // ==============================
        // 🔥 지도 자동 줌 조정
        // ==============================

        const bounds = new kakao.maps.LatLngBounds();
        linePath.forEach(p => bounds.extend(p));
        window.kakaoMap.setBounds(bounds);

        // ==============================
        // 🔥 추가 기능 (상점 연동)
        // ==============================

        coordinateInsert();

    } catch (err) {
        console.error(err);
        alert("경로 생성 실패");
    } finally {
        isNavigating = false;
    }
}

/**
 * [전역 변수] 생성된 오버레이 객체를 저장합니다.
 * 새로운 경로를 검색할 때 기존 핀을 지도에서 지우기 위해 참조가 필요합니다.
 */
let startOverlay = null; // 출발지 커스텀 오버레이 객체
let endOverlay = null;   // 도착지 커스텀 오버레이 객체

/**
 * [애니메이션 설정] 말풍선이 위아래로 움직이는 효과를 정의합니다.
 * HTML 헤더(head)에 스타일 태그를 주입하여 전역 CSS 클래스를 생성합니다.
 */
const style = document.createElement('style');
style.textContent = `
    /* bobbing이라는 이름의 애니메이션 정의 */
    @keyframes bobbing {
        0%, 100% { transform: translateY(0); }    /* 시작과 끝은 제자리 */
        50% { transform: translateY(-8px); }     /* 중간(0.6초)에 위로 6px 이동 */
    }
    /* 이 클래스를 가진 요소는 1.2초마다 무한히 둥실둥실 움직임 */
    .bobbing-label {
        animation: bobbing 1.2s ease-in-out infinite;
    }
`;
document.head.appendChild(style);

/**
 * [메인 함수] 특정 좌표에 출발/도착 핀을 꽂습니다.
 * @param {kakao.maps.LatLng} position - 핀이 꽂힐 카카오맵 좌표 객체
 * @param {string} type - 'START' 또는 'END' 구분값
 */
function setPointMarker(position, type) {
    const isStart = type === 'START';
    const label = isStart ? '출발지' : '도착지';
    const bgColor = isStart ? '#3b82f6' : '#ec4899'; 

    const content = document.createElement('div');
    // ⭐ [수정] 1. 다른 마커나 선보다 항상 위에 있도록 가장 높은 우선순위(z-index) 부여
    content.style.cssText = 'display: flex; flex-direction: column; align-items: center; white-space: nowrap; z-index: 9999;';
    
    content.innerHTML = `
        <div class="bobbing-label" style="
            background: ${bgColor};
            color: white;
            padding: 6px 16px;           /* 안쪽 여백을 늘려 말풍선 크기 키움 */
            border-radius: 20px;         /* 크기에 맞게 모서리를 더 둥글게 */
            font-size: 14px;             /* 글자 크기 키움 */
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3); /* 그림자도 크기에 맞춰 입체감 강화 */
            position: relative;
            margin-bottom: 10px;         /* 핀과의 간격을 살짝 늘림 */
        ">
            ${label}
            <div style="
                position: absolute;
                bottom: -8px;            /* 꼬리 위치 조정 */
                left: 50%;
                transform: translateX(-50%);
                border-top: 9px solid ${bgColor}; /* 꼬리 크기 키움 */
                border-left: 7px solid transparent;
                border-right: 7px solid transparent;
            "></div>
        </div>

        <div style="
            width: 28px;                 /* 핀 너비 키움 */
            height: 28px;                /* 핀 높이 키움 */
            background: ${bgColor};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 6px rgba(0,0,0,0.4); /* 그림자 강화 */
        "></div>
    `;

    // 3. 카카오맵 커스텀 오버레이 객체 생성 및 지도 표시
    const overlay = new kakao.maps.CustomOverlay({
        map: window.kakaoMap,
        position: position,
        content: content,
        yAnchor: 1,
        // 카카오맵 객체 자체의 우선순위도 가장 높게 설정
        zIndex: 9999 
    });

    // 4. 관리 및 교체 로직 (기존과 동일)
    if (isStart) {
        if (startOverlay) startOverlay.setMap(null); 
        startOverlay = overlay;
    } else {
        if (endOverlay) endOverlay.setMap(null);
        endOverlay = overlay;
    }
}