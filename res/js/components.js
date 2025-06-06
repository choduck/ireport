let Tnb = {
	props: ['_this', 'type'],  
	template: `
<header>
    <div class="tnb">
        <div class="logo-icon" @click="goHome"></div>
        <div class="menu-mobile-icon" @click="inflatedMenu = !inflatedMenu"></div>
        <div class="inflated-menu" :class="{active: inflatedMenu == true}">
            <div class="menu-list">
                <div @click="selectMenu('회사소개')">
                    <div class="menu-item" :class="{active: selectedMenu == '회사소개'}">
                        <span>회사소개</span>
                        <div class="arrow-up-icon"></div>
                    </div>
                    <div class="menu-item-inner" :class="{active: selectedMenu == '회사소개', inactive: selectedMenu != '회사소개'}">
                        <a href="/introduction">IReport Story</a>
                        <a href="/introduction">CEO 인사말</a>
                        <a href="/introduction">연혁</a>
                        <a href="/introduction">인증</a>
                        <a href="/introduction">파트너사</a>
                        <a href="/introduction">오시는길</a>
                        <a href="/introduction">문의하기</a>
                    </div>
                </div>
                <div @click="selectMenu('사업분야')">
                    <div class="menu-item" :class="{active: selectedMenu == '사업분야'}">
                        <span>사업분야</span>
                        <div class="arrow-up-icon"></div>
                    </div>
                    <div class="menu-item-inner" :class="{active: selectedMenu == '사업분야', inactive: selectedMenu != '사업분야'}">
                        <a href="/business">공간정보 구축</a>
                        <a href="/business">시스템 통합</a>
                        <a href="/business">R&D</a>
                        <a href="/business">AI</a>
                    </div>
                </div>
                <div @click="selectMenu('솔루션')">
                    <div class="menu-item" :class="{active: selectedMenu == '솔루션'}">
                        <span>솔루션</span>
                        <div class="arrow-up-icon"></div>
                    </div>
                    <div class="menu-item-inner" :class="{active: selectedMenu == '솔루션', inactive: selectedMenu != '솔루션'}">
                        <a href="/solution">Eco-Report</a>
                        <a href="/solution">Stat-Report</a>
                    </div>
                </div>
                <div @click="selectMenu('수행실적')">
                    <div class="menu-item" :class="{active: selectedMenu == '수행실적'}">
                        <span>수행실적</span>
                        <div class="arrow-up-icon"></div>
                    </div>
                    <div class="menu-item-inner" :class="{active: selectedMenu == '수행실적', inactive: selectedMenu != '수행실적'}">
                        <a href="/construction-cases">구축사례</a>
                    </div>
                </div>
                <div @click="selectMenu('채용정보')">
                    <div class="menu-item" :class="{active: selectedMenu == '채용정보'}">
                        <span>채용정보</span>
                        <div class="arrow-up-icon"></div>
                    </div>
                    <div class="menu-item-inner" :class="{active: selectedMenu == '채용정보', inactive: selectedMenu != '채용정보'}">
                        <a href="/recruit">인재상/복지</a>
                        <a href="/recruit">채용안내</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="index-visual" v-if="type == '메인'">
        <div id="carousel">
            <div class="carousel-item">
				<video width="100%" height="100%" preload='none' width='100%' height='auto' playsinline webkit-playsinline muted autoplay>
					<source src="/mov/main.mp4" type="video/mp4">
				</video>
              <div class="hero-title-1"/>
            </div>
            <div class="carousel-item">
                <img loading="lazy" src="/img/main-carousel.jpg" alt="메인 케러셀 이미지 두 번째"/>
                <div class="hero-title-2"/>
            </div>
        </div>
		<div class="index-block">
			<span class="text1">0{{index + 1}}</span>
			<span class="text2">/ 02</span>
			<button class="carousel-back-icon" @click="carousel('이전')"></button>
			<button class="carousel-pause-icon" @click="carousel('중지')"></button>
			<button class="carousel-next-icon" @click="carousel('다음')"></button>
		</div>
	</div>
    <div class="main-visual simple" v-if="type == '회사소개'">
        <img class="frame" src="/img/top-frame.svg" alt=""/>
        <div class="main"/>
        <div class="text">
            <span>회사소개</span>
            <span class="blue">Company</span>
        </div>
    </div>
    <div class="main-visual simple" v-if="type == '사업분야'">
        <img class="frame" src="/img/top-frame.svg" alt=""/>
        <div class="business"/>
        <div class="text">
            <span>사업분야</span>
            <span class="blue">Company</span>
        </div>
    </div>
    <div class="main-visual simple" v-if="type == '솔루션'">
        <img class="frame" src="/img/top-frame.svg" alt=""/>
        <div class="solution"/>
        <div class="text">
            <span>솔루션</span>
            <span class="blue">Solution</span>
        </div>
    </div>
    <div class="main-visual simple" v-if="type == '채용정보'">
        <img class="frame" src="/img/top-frame.svg" alt=""/>
        <div class="recruit"/>
        <div class="text">
            <span>채용정보</span>
            <span class="blue">Recruitment</span>
        </div>
    </div>
    <div class="main-visual simple" v-if="type == '수행실적'">
        <img class="frame" src="/img/top-frame.svg" alt=""/>
        <div class="construction"/>
        <div class="text">
            <span>수행실적</span>
            <span class="blue">Performance</span>
        </div>
    </div>
</header>`,
	data() {
		return {
			noActing: false,
			inv: null,
			index: 0,
            inflatedMenu: false,
            selectedMenu: '',
            isTnbActive: false
		}
	},
	methods: {
        selectMenu: function (label) {
            if(this.selectedMenu == label) this.selectedMenu = ''
            else this.selectedMenu = label
        },
		goHome: function () {
			location.href = "/"
		},
		carousel: function (cmd) {
			if(cmd == '중지')
			{
				this.noActing = !this.noActing
			}
			if(!!this.noActing) return
			if(cmd == '이전')
			{
				document.querySelector("#carousel").style = "transform: translateX(0vw);"
				index = 0
			}
			else if(cmd == '다음')
			{
				document.querySelector("#carousel").style = "transform: translateX(-50%);"
				index = 1
			}
		}
	},
	computed: {
	}, 
	created() {
		let thisVar = this
		let count = 0
        if(this._this.themeClass.mobile)
            this.inflatedMenu = false
		if(window.location.pathname === '/')
			this.inv = setInterval(() => {
				count++
				if(count == 25)
				{
					thisVar.carousel('다음')
					count = -20
				}
				if(count == 0)
					thisVar.carousel('이전')
			}, 1000)
	},
	beforeDestroy() {
		clearInterval(this.inv)
	}
}
Vue.component('Tnb', Tnb)
let Bnb = {
  props: [],  
  template: `
<footer>
    <div class="company-info">
        <div class="logo-mobile-icon"></div>
        <div class="h-stack">
            <div class="info-item">
                <div class="text">㈜아이리포트</div>
            </div>
            <div class="info-item">
                <div class="subtitle">대표자</div>
                <div class="text">호종광</div>
            </div>
        </div>
        <div class="h-stack">
            <div class="info-item">
                <div class="subtitle">주소</div>
                <div class="text">서울특별시 금천구 가산디지털2로 101, A동 604호</div>
            </div>
            <div class="info-item">
                <div class="subtitle">사업자등록번호</div>
                <div class="text">271-88-02331</div>
            </div>
        </div>
        <div class="h-stack">
            <div class="info-item">
                <div class="subtitle">Tel</div>
                <div class="text">02-6673-1005</div>
            </div>
            <div class="info-item">
                <div class="subtitle">Fax</div>
                <div class="text">02-6673-1006</div>
            </div>
            <div class="info-item">
                <div class="subtitle">E-mail</div>
                <div class="text">ireport.co.kr</div>
            </div>
        </div>
    </div>
    <div class="right-side"><a href="">개인정보처리방침</a><span>Copyright © IReport. All rights reserved.</span></div>
</footer>`,
  data() {
    return {
      index: 0,
    }
  },
  methods: {
  },
  computed: {
  },
  created() {
  }
}
Vue.component('Bnb', Bnb)
let TnbAdmin = {
  template: '#tnb-admin',
  methods: {
  },
  computed: {
  }, 
  created() {
  }
}
Vue.component('TnbAdmin', TnbAdmin)
let Lnb = {
  template: '#lnb',
  props: ['menuName', 'itemFocused'],
  data() {
    return {
    }
  },
  methods: {
  },  
  computed: {
  }, 
  created() {
  }
}
Vue.component('Lnb', Lnb)
const CommonTable = {
  props: ['_this', 'data', 'columns', 'tableName'],
  template: `
<b-table
  :data="data"
  :total="data.length"
  :selected.sync="_this.selectedRow"
  @select="onSelect"
  @dblclick="onDblClick"
  draggable
  draggable-column
  @dragstart="dragstart"
  @drop="drop"
  @dragover="dragover"
  @dragleave="dragleave"
  :show-detail-icon="true"
  backend-pagination
  @page-change="onPageChange"
  paginated :per-page="countPerPage" aria-next-label="다음 페이지" aria-previous-label="이전 페이지" aria-page-label="페이지" aria-current-label="현재 페이지" detail-key="NO" detailed>
  <b-table-column :visible="true" field="NO" label="NO" sortable 
    cell-class="id-column-width" v-slot="props">
    <span>{{ props.row['NO'] }}</span>
  </b-table-column>
  <b-table-column :visible="column.visible" :field="column.field" :label="column.label" sortable 
    cell-class="max-width" v-slot="props" v-if="column.field != 'id'" v-for="column in columns">
    <b-taglist v-if="column.label === 'Category'">
      <b-tag v-for="element in  props.row[column.field].split(',')">{{ element }}</b-tag>
    </b-taglist>
    <a class="link-toggle-details" v-else-if="column.label === '제목'" :href="'/admin' + props.row['URL']">{{props.row[column.field]}}</a>
    <a class="link-toggle-details" v-else-if="column.label === '국문제목'" :href="'/admin' + props.row['URL']">{{props.row[column.field]}}</a>
    <span v-else>{{ props.row[column.field] }}</span>
  </b-table-column>
  <template #detail="props">
    <article class="media">
      <div class="media-content">
        <span v-if="!!props.row['설명']">{{props.row['설명']}}</span>
        <span v-else-if="!!props.row['파일명'] && tableName == '프로파일이력'">{{props.row['파일명']}}</span>
        <table class="is-no-border" v-else-if="!!props.row['내용'] && tableName === '문의'">
          <tbody>
            <tr v-for="key in ['제목', '회사명', '성함', '연락처', '이메일', '예산', '내용']">
              <th>{{key}}</th>
              <td>{{props.row[key]}}</td>
            </tr>
          </tody>
        </table>
      </div>
    <article>
  </template>
</b-table>
  `,
  data() {
    return {
      draggingRow: null,
      draggingRowIndex: null,
      draggingColumn: null,
      draggingColumnIndex: null,
      countPerPage: 50
    }
  },
  methods: {
    downloadFile(event, row, columnName, columnNameReserved) {
      window.open(`/api/v3/file-list/download?t=${this.tableName}&i=${row.id}&c=${columnName}&cr=${columnNameReserved}`, '_blank')
    },
    onDblClick() {
      this.onSelect()
      if(this.tableName === '문의')
      {
      }
      else
      {
      }
    },
    onSelect() {
    },
    onPageChange(pageIndex) {
      const thisVar = this
      if(this.data.length > pageIndex * this.countPerPage)
      {
        // 로딩 필요 없음
      }
      else
      {
      }

    },
    dragstart(payload) {
      this.draggingRow = payload.row
      this.draggingRowIndex = payload.index
      payload.event.dataTransfer.effectAllowed = 'copy'
    },
    dragover(payload) {
      payload.event.dataTransfer.dropEffect = 'copy'
      payload.event.target.closest('tr').classList.add('is-selected')
      payload.event.preventDefault()
    },
    dragleave(payload) {
      payload.event.target.closest('tr').classList.remove('is-selected')
      payload.event.preventDefault()
    },
    async drop(payload) {
      if(this.tableName == '프로파일이력') return
      const thisVar = this
      function exchangeElement (from, to) {
        return new Promise((res, rej) => {
          http({
              method: "PUT", uri: '/api/v3/exchange-id', param: {
              tableName: this.tableName,
              from: from,
              to: to,
              option: {type: '', noSend: false}
            },
            cb: (data) => {
              //data.result
              if(data.code === 0)
              {
                console.log("전송후")
                let tableData = this.data, fromIndex, toIndex
                for(let [index, row] of tableData.entries())
                {
                  if(row.id == from.id)
                    fromIndex = index
                  if(row.id == to.id)
                    toIndex = index
                }
                tableData[fromIndex] = to
                tableData.splice(toIndex, 1, from)

                let to_id = to.id
                tableData[fromIndex].id = from.id
                tableData[toIndex].id = to_id
                res(true)
              }
              else
                res(false)
            }, ecb: (reason) => {
              console.log(reason)
              rej(false)
            }
          })
        })
      }
      payload.event.target.closest('tr').classList.remove('is-selected')
      //this.$buefy.toast.open(`드래그 앤 드롭은 지원하지 않습니다.`)
      let result = await exchangeElement.bind(this)(this.draggingRow, payload.row)
      if(!!result)
        return
      else
        this.$buefy.toast.open(`NO(${this.draggingRow.id}) to NO(${payload.row.id}) 로의 교환 실패.`)
    },
    save() {
    }
  },
  mounted()
  {
  },
  beforeDestroy()
  {
  }
}
Vue.component('common-table', CommonTable)