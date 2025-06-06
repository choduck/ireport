const axios = require('axios');

async function testDelete() {
  try {
    console.log('삭제 API 테스트 시작...');
    
    // 먼저 데이터 조회
    const listResponse = await axios.patch('http://localhost:8888/api/v2/table', {
      api_key: 'test',
      tableName: 'TB_NOTICE1',
      row: {},
      option: { rowId: '목록전체' }
    }, {
      headers: {
        'Cookie': 'myCookie=your_jwt_token_here',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('조회 응답:', listResponse.data);
    
    if (listResponse.data.code === 0 && Array.isArray(listResponse.data.data)) {
      const constructionCases = listResponse.data.data.filter(item => 
        item && item['카테고리'] === '구축사례'
      );
      
      console.log('구축사례 개수:', constructionCases.length);
      
      if (constructionCases.length > 0) {
        const targetItem = constructionCases[0];
        console.log('삭제할 항목:', targetItem);
        
        // 삭제 테스트
        const deleteResponse = await axios.delete('http://localhost:8888/api/v2/table/delete', {
          data: {
            api_key: 'test',
            tableName: 'TB_NOTICE1',
            option: { rowId: targetItem.NO }
          },
          headers: {
            'Cookie': 'myCookie=your_jwt_token_here',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('삭제 응답:', deleteResponse.data);
      }
    }
    
  } catch (error) {
    console.error('오류 발생:', error.response ? error.response.data : error.message);
  }
}

testDelete();
