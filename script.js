// 버튼 클릭 시 실행될 함수
async function getData() {
    const displayDiv = document.getElementById('display');
    displayDiv.innerText = '서버에 요청 중...';
    
    try {
        // Flask 서버에 GET 요청
        const response = await fetch('http://127.0.0.1:5000/api/hello');
        
        // JSON 데이터로 변환
        const data = await response.json();
        
        // 화면에 표시
        displayDiv.innerText = `서버 응답: ${data.message}`;
        
    } catch (error) {
        displayDiv.innerText = `에러 발생: ${error.message}`;
        console.error('Error:', error);
    }
}