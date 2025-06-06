const axios = require('axios')
const dayjs = require('dayjs')

// 테스트용 구축사례 데이터
const testCases = [
  {
    고객사: '한국전력공사',
    사업명: '스마트그리드 관리시스템 구축',
    사업기간: '2025.01 ~ 2025.06',
    카테고리: '구축사례'
  },
  {
    고객사: '서울특별시',
    사업명: '도시계획 통합관리 플랫폼',
    사업기간: '2024.09 ~ 2025.02',
    카테고리: '구축사례'
  },
  {
    고객사: '환경부',
    사업명: '대기질 모니터링 시스템',
    사업기간: '2025.02 ~ 2025.08',
    카테고리: '구축사례'
  }
]

async function addTestCase(caseData) {
  try {
    const response = await axios({
      url: 'http://localhost:8888/api/v2/table',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'myCookie=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiLslYTsnbTrlJQiLCJpYXQiOjE3MzY1NzI4MDAsImV4cCI6MTczNjU4MDAwMH0.xxxxxxxxx' // 실제 JWT 토큰으로 교체 필요
      },
      auth: {
        username: 'username-localhost-1',
        password: 'password-localhost-1'
      },
      data: {
        api_key: 'testkey123',
        tableName: 'TB_NOTICE1',
        row: caseData,
        origin: 'localhost-1'
      }
    })
    
    console.log(`구축사례 추가 성공: ${caseData.고객사}`)
    console.log('응답:', response.data)
  } catch (error) {
    console.error(`구축사례 추가 실패: ${caseData.고객사}`)
    console.error('에러:', error.response ? error.response.data : error.message)
  }
}

async function main() {
  console.log('테스트 구축사례 추가 시작...')
  
  for (const testCase of testCases) {
    await addTestCase(testCase)
    // 요청 간 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('테스트 구축사례 추가 완료!')
}

// 실행
main()
