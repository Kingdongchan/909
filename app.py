from flask import Flask, jsonify, render_template
from flask_cors import CORS
import os  
from dotenv import load_dotenv  # ← 추가!


load_dotenv()  # .env 파일 로드



app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template(
        'login.html',
        supabase_url=os.getenv('SUPABASE_URL'),
        supabase_key=os.getenv('SUPABASE_ANON_KEY')
    )

@app.route('/signup')  # ← 이 부분 추가!
def signup():
    return render_template(
        'signup.html',
        supabase_url=os.getenv('SUPABASE_URL'),
        supabase_key=os.getenv('SUPABASE_ANON_KEY')
    )


@app.route('/map')
def map_page():
    return render_template('map.html') 

@app.route('/community/<place_name>')
def community_page(place_name):
    return render_template('community.html', place_name=place_name) 

# 새로 추가하는 API 엔드포인트
@app.route('/api/hello')
def api_hello():
    return jsonify({"message": "Success!"})

@app.route('/api/fail')
def api_fail():
    # 404 에러와 함께 메시지 전송
    return jsonify({"message": "요청하신 페이지를 찾을 수 없습니다!"}), 404


if __name__ == '__main__':
    app.run(debug=True, port=5001)