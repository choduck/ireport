const { findSome, findSomeWrapper } = require('./db-core2')

async function checkData() {
  try {
    // TB_NOTICE1 테이블의 메타데이터 확인
    console.log('=== TB_NOTICE1 메타데이터 확인 ===')
    const meta = await findSome({
      tenancy: '매니스탈링스',
      some: 'table-TB_NOTICE1/메타'
    })
    console.log('메타데이터:', meta)
    
    // 전체 데이터 확인
    console.log('\n=== TB_NOTICE1 전체 데이터 확인 ===')
    const allData = await findSomeWrapper({
      tenancy: '매니스탈링스',
      some: 'table-TB_NOTICE1',
      rowId: '목록전체'
    })
    
    if (allData && Array.isArray(allData)) {
      console.log('전체 데이터 개수:', allData.length)
      
      // 구축사례만 필터링
      const constructionCases = allData.filter(item => 
        item && item['카테고리'] === '구축사례'
      )
      
      console.log('\n구축사례 개수:', constructionCases.length)
      
      if (constructionCases.length > 0) {
        console.log('\n=== 첫 번째 구축사례 상세 ===')
        const firstCase = constructionCases[0]
        console.log('전체 데이터:', firstCase)
        console.log('\n각 필드:')
        Object.keys(firstCase).forEach(key => {
          console.log(`  ${key}: "${firstCase[key]}"`)
        })
      }
    }
  } catch (error) {
    console.error('데이터 확인 중 오류:', error)
  }
}

checkData()
