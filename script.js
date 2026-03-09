// 버튼 클릭 시 실행될 함수
async function getData() {
    // 1. 서버에 요청 보내기 (포트 번호를 Flask와 맞추세요!)
    const response = await fetch('http://localhost:3000/api/hello');
    
    // 2. 받은 JSON 데이터를 자바스크립트 객체로 변환
    const data = await response.json();
    
    // 3. 화면에 출력
    document.getElementById('display').innerText = data.message;
}