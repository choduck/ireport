const CommonDaemon = {
  props: [],
  data() {
    return {
      onScrollCounter: 0,
      el: [],
      offsetTopList: [],
      lastY: -1,
      ADJUST_Y_DISTANCE: 200,
      FINAL_MARGIN_SIZE: 20,
      TIMEOUT: 900,
      prevScrollY: 0,
      submenuElHeight: 0,
      tnbEl: 0,
      submenuEl: null,
      inflatedMenuEl: null,
      submenuInflated: false
    }
  },
  methods: {
    onScrollListener: function (e) {
      this.el.forEach((element, index) => {
        // 새 탭 클릭시
        if(element.parentNode == null) {
          this.initElements()
          return
        }

        // 커스텀 제외 엘리먼트
        if(
          element.parentNode.classList.contains('business-card') ||
          element.parentNode.classList.contains('accordian-item') ||
          element.parentNode.classList.contains('slide')
        )
          return
        
        let targetY = this.offsetTopList[index] - window.innerHeight + this.ADJUST_Y_DISTANCE
        if(targetY - this.FINAL_MARGIN_SIZE * 0 < window.scrollY && window.scrollY < targetY + element.clientHeight + this.FINAL_MARGIN_SIZE) return
        if(targetY - this.FINAL_MARGIN_SIZE * 10 < window.scrollY && window.scrollY < targetY + this.FINAL_MARGIN_SIZE * 10)
        {
          if(window.scrollY - this.lastY >= 0) // 아래로 스크롤
          {
            if(element.classList.contains('animation')) return
            element.classList.remove('de-animation')
            element.classList.add('animation')
            setTimeout(() => {
              element.classList.remove('animation')
            }, this.TIMEOUT)
          }
          else // 위로 스크롤
          {
            if(element.classList.contains('de-animation')) return
            element.classList.remove('animation')
            element.classList.add('de-animation')
            setTimeout(() => {
              element.classList.remove('de-animation')
            }, this.TIMEOUT)
          }
        }
        if(!!this.submenuEl && !this.inflatedMenuEl.classList.contains('active'))
        {
          let nowScrollY = window.scrollY
          if(nowScrollY >= this.submenuElHeight)
          {
            if(!this.submenuEl.classList.contains('very-top'))
              this.submenuEl.classList.add('very-top')

            if(nowScrollY - this.lastY < 0 && this.tnbEl.clientHeight)
            {
              this.submenuEl.classList.remove('very-top')
              this.submenuEl.classList.add('top-' + this.tnbEl.clientHeight)
              document.querySelector('.tnb').classList.remove('inactive')
            }
            else
            {
              this.submenuEl.classList.remove('top-' + this.tnbEl.clientHeight)
              this.submenuEl.classList.add('very-top')
              document.querySelector('.tnb').classList.add('inactive')
            }
          }
          else
          {
            document.querySelector('.tnb').classList.remove('inactive')
            this.submenuEl.classList.remove('very-top')
            this.submenuEl.classList.remove('top-100')
            this.submenuEl.classList.remove('top-80')
          }
          if(nowScrollY - this.lastY < 0)
            document.querySelector('.tnb').classList.remove('inactive')

        }

      })
      this.lastY = window.scrollY
    },
    initElements: function () {
      this.el = []
      this.offsetTopList = []
      const getOffsetTop = function (element) {
        if (!element) return 0
        return getOffsetTop(element.offsetParent) + element.offsetTop
      }

      this.submenuEl = document.querySelector('.content-list')
      this.tnbEl = document.querySelector('.tnb')
      this.inflatedMenuEl = document.querySelector('.inflated-menu')
      if(!!this.submenuEl)
      {
        this.submenuElHeight = getOffsetTop(this.submenuEl)
        if(window.location.pathname !== '/introduction')
          this.submenuEl.classList.add('is-white')
      }

      setTimeout(() => {
        if(window.location.pathname === '/') {
          ['article.ireport h2', '.business-card', '.contact-box'].forEach(e => {
            this.el.push(...document.querySelectorAll(e))
          })
        }
        else if(window.location.pathname === '/introduction') {
          [].forEach(e => {
            this.el.push(...document.querySelectorAll(e))
          })
        }
        else if(window.location.pathname === '/business') {
          ['.image-title', '.business-card'].forEach(e => {
            this.el.push(...document.querySelectorAll(e))
          })
        }
        else if(window.location.pathname === '/solution') {
          ['article.maps .card', '.solution-deatil-card'].forEach(e => {
            this.el.push(...document.querySelectorAll(e))
          })
        }
        else if(window.location.pathname === '/recruit') {
          ['article.benefits .card'].forEach(e => {
            this.el.push(...document.querySelectorAll(e))
          })
        }
        ['h1', 'article'].forEach(e => {
          this.el.push(...document.querySelectorAll(e))
        })
        this.el.forEach((el, index) => {
          this.offsetTopList.push(getOffsetTop(el))
        })
        window.onscroll = this.onScrollListener
      }, 0) 
    }
  },
  mounted()  
  {
    this.initElements()
  },
  beforeDestroy()
  {
    window.removeEventListener('scroll', this.onScrollListener)
  }
}
Vue.component('common-daemon', CommonDaemon)