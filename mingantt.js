const app = Vue.createApp({
  data() {
    return {
      start_month: '2021-10',
      end_month: '2022-02',
      block_size: 30,
      block_number: 0,
      calendars:[],
      inner_width: '',
      inner_height: '',
      task_width: '',
      task_height: '',
      today:moment(),
      categories: [
        {
          id: 1,
          name: 'テストA',
          collapsed: false,
        }, {
          id: 2,
          name: 'テストB',
          collapsed: false,
        }
      ],
      tasks: [
        {
          id: 1,
          category_id: 1,
          name: 'テスト1',
          start_date: '2021-12-18',
          end_date: '2021-12-20',
          incharge_user: '鈴木',
          percentage: 100,
        },
        {
          id: 2,
          category_id: 1,
          name: 'テスト2',
          start_date: '2021-12-19',
          end_date: '2021-12-23',
          incharge_user: '佐藤',
          percentage: 90,
        },
        {
          id: 3,
          category_id: 1,
          name: 'テスト3',
          start_date: '2021-12-19',
          end_date: '2022-01-04',
          incharge_user: '鈴木',
          percentage: 40,
        },
        {
          id: 4,
          category_id: 1,
          name: 'テスト4',
          start_date: '2021-12-21',
          end_date: '2021-12-30',
          incharge_user: '山下',
          percentage: 60,
        },
        {
          id: 5,
          category_id: 1,
          name: 'テスト5',
          start_date: '2021-12-25',
          end_date: '2022-01-04',
          incharge_user: '佐藤',
          percentage: 5,
        },
        {
          id: 6,
          category_id: 2,
          name: 'テスト6',
          start_date: '2021-12-28',
          end_date: '2022-01-08',
          incharge_user: '佐藤',
          percentage: 0,
        },
      ],
      position_id: 0,
      dragging:false,
      pageX:'',
      elememt:'',
      left:'',
      task_id:'',
      width:'',
      leftResizing:false,
      rightResizing:false,
      task: '',
      show: false,
      form: {
        category_id: '',
        id: '',
        name: '',
        start_date: '',
        end_date: '',
        incharge_user: '',
        percentage: 0
      },
      update_mode: false
    }
  },
  methods:{
    getDays(year, month, block_number) {
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
      let days = [];
      let date = moment(`${year}-${month}-01`);
      let num = date.daysInMonth();
      for (let i = 0; i < num; i++) {
        days.push({
          day: date.date(),
          dayOfWeek: dayOfWeek[date.day()],
          block_number
        })
        date.add(1, 'day');
        block_number++;
      }
      return days;
    },
    getCalendar() {
      let block_number = 0;
      let days;
      let start_month = moment(this.start_month)
      let end_month = moment(this.end_month)
      let between_month = end_month.diff(start_month, 'months')
      for (let i = 0; i <= between_month; i++) {
        days = this.getDays(start_month.year(), start_month.format('MM'), block_number);
        this.calendars.push({
          date: start_month.format('YYYY年MM月'),
          year: start_month.year(),
          month: start_month.month(), //month(), 0,1..11と表示
          start_block_number: block_number,
          calendar: days.length,
          days: days
        })
        start_month.add(1, 'months')
        block_number = days[days.length - 1].block_number
        block_number++;
      }
      return block_number;
    },
    getWindowSize() {
      this.inner_width = window.innerWidth;
      this.inner_height = window.innerHeight;
      this.task_width = this.$refs.task.offsetWidth;
      this.task_height = this.$refs.task.offsetHeight;
    },
    todayPosition() {
      this.$refs.calendar.scrollLeft = this.scrollDistance
    },
    windowSizeCheck() {
      let height = this.lists.length - this.position_id
      if (event.deltaY > 0 && height * 40 > this.calendarViewHeight) {
        this.position_id++
      } else if (event.deltaY < 0 && this.position_id !== 0) {
        this.position_id--
      }
    },
    mouseDownMove(task){
      this.dragging = true;
      this.pageX = event.pageX;
      this.element = event.target;
      this.left = event.target.style.left;
      this.task_id = task.id
      console.log('mouseDownMove')
    },
    mouseMove() {
      if (this.dragging) {
        let diff = this.pageX - event.pageX;
        this.element.style.left = `${parseInt(this.left.replace('px', '')) - diff}px`;
      }
    },
    stopDrag(){
      if (this.dragging) {
        let diff = this.pageX - event.pageX
        let days = Math.ceil(diff / this.block_size)
        if (days !== 0) {
          console.log(days)
          let task = this.tasks.find(task => task.id === this.task_id);
          let start_date = moment(task.start_date).add(-days, 'days')
          let end_date = moment(task.end_date).add(-days, 'days')
          task['start_date'] = start_date.format('YYYY-MM-DD')
          task['end_date'] = end_date.format('YYYY-MM-DD')
        } else {
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX;
        let days = Math.ceil(diff / this.block_size)
        if (days !== 0) {
          let task = this.tasks.find(task => task.id === this.task_id);
          let start_date = moment(task.start_date).add(-days, 'days')
          let end_date = moment(task.end_date)
          if (end_date.diff(start_date, 'days') <= 0) {
            task['start_date'] = end_date.format('YYYY-MM-DD')
          } else {
            task['start_date'] = start_date.format('YYYY-MM-DD')
          }
        } else {
          this.element.style.width = this.width;
          this.element.style.left = `${this.left.replace('px', '')}px`;
        }
      }
      if (this.rightResizing) {
        let diff = this.pageX - event.pageX;
        let days = Math.ceil(diff / this.block_size)
        if (days === 1) {
          this.element.style.width = `${parseInt(this.width.replace('px', ''))}px`;
        } else if (days <= 2) {
          days--;
          let task = this.tasks.find(task => task.id === this.task_id);
          let end_date = moment(task.end_date).add(-days, 'days')
          task['end_date'] = end_date.format('YYYY-MM-DD')
        } else {
          let task = this.tasks.find(task => task.id === this.task_id);
          let start_date = moment(task.start_date);
          let end_date = moment(task.end_date).add(-days, 'days')
          if (end_date.diff(start_date, 'days') < 0) {
            task['end_date'] = start_date.format('YYYY-MM-DD')
          } else {
            task['end_date'] = end_date.format('YYYY-MM-DD')
          }
        }
      }
      this.dragging = false;
      this.leftResizing = false;
      this.rightResizing = false;
    },
    mouseDownResize(task, direction) {
      direction === 'left' ? this.leftResizing = true : this.rightResizing = true;
      this.pageX = event.pageX;
      this.width = event.target.parentElement.style.width;
      this.left = event.target.parentElement.style.left;
      this.element = event.target.parentElement;
      this.task_id = task.id
    },
    mouseResize() {
      if (this.leftResizing) {
        let diff = this.pageX - event.pageX
        if (parseInt(this.width.replace('px', '')) + diff > this.block_size) {
          this.element.style.width = `${parseInt(this.width.replace('px', '')) + diff}px`
          this.element.style.left = `${this.left.replace('px', '') - diff}px`;
        }
      }
      if (this.rightResizing) {
        let diff = this.pageX - event.pageX;
        if (parseInt(this.width.replace('px', '')) - diff > this.block_size) {
          this.element.style.width = `${parseInt(this.width.replace('px', '')) - diff}px`
        }
      }
    },
    dragTask(dragTask) {
      this.task = dragTask;
    },
    dragTaskOver(overTask) {
      let deleteIndex;
      let addIndex;
      if (this.task.cat !== 'category') {
        if (overTask.cat === 'category') {
          let updateTask = this.tasks.find(task => task.id === this.task.id)
          updateTask['category_id'] = overTask['id']
        } else {
          if (overTask.id !== this.task.id) {
            this.tasks.map((task, index) => { if (task.id === this.task.id) deleteIndex = index })
            this.tasks.map((task, index) => { if (task.id === overTask.id) addIndex = index })
            this.tasks.splice(deleteIndex, 1)
            this.task['category_id'] = overTask['category_id']
            this.tasks.splice(addIndex, 0, this.task)
          }
        }
      }
    },
    toggleCategory(task_id) {
      let category = this.categories.find(category => category.id === task_id)
      category['collapsed'] = !category['collapsed'];
    },
    addTask() {
      this.update_mode = false;
      this.form = {}
      this.show = true;
    },
    saveTask() {
      this.tasks.push(
        this.form
      )
      this.form = {}
      this.show = false
    },
    editTask(task){
      this.update_mode=true;
      this.show = true;
      Object.assign(this.form, task);
    },
    updateTask(id) {
      let task = this.tasks.find(task => task.id === id);
      Object.assign(task, this.form);
      this.form = {}
      this.show = false;
    },
    deleteTask(id) {
      let delete_index;
      this.tasks.map((task, index) => {
        if (task.id === id) delete_index = index;
      })
      this.tasks.splice(delete_index, 1)
      this.form = {}
      this.show = false;
    },
  },
  mounted() {
    this.getCalendar();
    this.getWindowSize();
    window.addEventListener('resize', this.getWindowSize);
    window.addEventListener('wheel', this.windowSizeCheck);
    window.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mousemove', this.mouseResize);
    window.addEventListener('mouseup', this.stopDrag);
    this.$nextTick(() => {
      this.todayPosition();
    });
  },
  computed: {
    calendarViewWidth() {
      return this.inner_width - this.task_width;
    },
    calendarViewHeight() {
      return this.inner_height - this.task_height - 48 - 20;
    },
    scrollDistance() {
      let start_date = moment(this.start_month);
      let between_days = this.today.diff(start_date, 'days')
      return (between_days + 1) * this.block_size - this.calendarViewWidth / 2;
    },
    lists() {
      let lists = [];
      this.categories.map(category => {
        lists.push({ cat: 'category', ...category });
        this.tasks.map(task => {
          if (task.category_id === category.id && !category.collapsed) {
            lists.push({ cat: 'task', ...task })
          }
        })
      })
      return lists;
    },
    taskBars() {
      let start_date = moment(this.start_month);
      let top = 10;
      let left;
      let between;
      let start;
      let style;
      return this.displayTasks.map(task => {
        style = {}
        if(task.cat==='task'){
          let date_from = moment(task.start_date);
          let date_to = moment(task.end_date);
          between = date_to.diff(date_from, 'days');
          between++;
          start = date_from.diff(start_date, 'days');
          left = start * this.block_size;
          style = {
            top: `${top}px`,
            left: `${left}px`,
            width: `${this.block_size * between}px`,
          }
        }
        top = top + 40;
        return {
          style,
          task
        }
      })
    },
    displayTasks() {
      let display_task_number = Math.floor(this.calendarViewHeight / 40);
      return this.lists.slice(this.position_id, this.position_id + display_task_number);
    },
  }

}).mount('#app');

