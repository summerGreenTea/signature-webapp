$(function() {

	'use strict'

	 $.fn.clickToggle = function(func1, func2) {
        var funcs = [func1, func2];
        this.data('toggleclicked', 0);
        this.click(function() {
            var data = $(this).data();
            var tc = data.toggleclicked;
            $.proxy(funcs[tc], this)();
            data.toggleclicked = (tc + 1) % 2;
        });
        return this;
    };
	var TMPL_CONFIG = {

		snapLineXTmpl: '<div class="guide-line-x"></div>',

		snapLineYTmpl: '<div class="guide-line-y"></div>',

		contextMenu: '<ul class="context-menu">' +
						'<li><a data-action="alter" href="javascript:void(0)">修改</a></li>' +
						'<li><a data-action="delete" href="javascript:void(0)">删除</a></li>' +
					 '</ul>',

		alterModalImage: '<div class="alter-modal alter-modal-image">' +
						 	'<div class="alter-group">' +
						 		'<label>项目:</label>' +
						 		'<span>微信二维码</span>' +
						 	'</div>' +
						 	'<div class="alter-preview">' +
						 		'<img src="" alt="">' +
						 	'</div>' +
						 	'<div class="alter-footer">' +
						 		'<button class="alter-button">上传图片</button>' +
						 	'</div>' +
						 '</div>',

		alterModalText: '<div class="alter-modal alter-modal-text">' +

						'</div>',
		propTextTmpl: 	'<div class="canvas-text" data-role="label" data-type="{{type}}" data-label="{{label}}">' +
							'<input type="text">' +
							'<span class="label-value">{{value}}</span>'+
						'</div>',
		propImageTmpl: '<div class="canvas-image" data-role="label" data-type="{{type}}" data-label="{{label}}">' +
					   	   '<img src="../images/lucienyu.png">' + 
					   	   '<div data-action="resize"></div>' +
					   '</div>'
	}

	function Signature(opts) {
		this.$container = $(opts.container)
		this.$props = $(opts.props)
		this.data = {}
		this.snapLines = []
		this.$focusCtx = null
		this.$contextMenuCtx = null
		this.$snapLineX = $(TMPL_CONFIG.snapLineXTmpl)
		this.$snapLineY = $(TMPL_CONFIG.snapLineYTmpl)
		this.$contextMenu = $(TMPL_CONFIG.contextMenu)
		this.propsInfo = {}
		this.init()
		window.data = this.data
	}

	Signature.prototype.init = function() {
		var $labels = this.$container.find('[data-role="label"]'),
			width = this.$container.width(),
			height = this.$container.height()
		this.$consoleX = $('.toolbar-console .x')
		this.$consoleY = $('.toolbar-console .y')
		this.globalCenter = [width / 2, height / 2]
		this.$container.append(this.$snapLineX, this.$snapLineY, this.$contextMenu)
		if($labels.length > 0) {
			this.initStaffs($labels)
		}
		this.initGlobalEvent()
		this.initContainerEvent()
		this.initPropsEvent()
		this.initToolbarEvent()
	}

	Signature.prototype.initGlobalEvent = function() {
		var $document = $(document),
			self = this,
			isCtrlAndCommand = {
				control: false,
				command: false
			}

		$document.on('keydown', function(e) {
			var keyCode  = e.keyCode,
				$ctx = self.$focusCtx,
				crossIncrease = 0,
				verticalIncrease = 0
			if(keyCode === 17) {
				isCtrlAndCommand.control = true
			} else if(keyCode === 91) {
				isCtrlAndCommand.command = true
			} else if($ctx) {
				switch(keyCode) {
					case 37:    // left
						crossIncrease = -10
						break
					case 38:    // up
						verticalIncrease = -10
						break
					case 39:    // right
						crossIncrease = 10
						break
					case 40:    // down
						verticalIncrease = 10
						break;
					default:
						break
				}
				// 判断是否按住了control键，如果按住了control，则x/y轴的位置更改
				// 变为原来的十分之一
				if(isCtrlAndCommand.control && isCtrlAndCommand.command) {
					crossIncrease = crossIncrease / 10
					verticalIncrease = verticalIncrease / 10
				}
				$ctx.css({
					left: '+=' + crossIncrease,
					top: '+=' + verticalIncrease
				})
				var position = $ctx.position()
				self._rewriteConsole(position.left, position.top)
				self._updateDateByEle(self.$focusCtx)
			}
		})
		$document.on('keyup', function(e) {
			var keyCode = e.keyCode
			if(keyCode === 17) {
				isCtrlAndCommand.control = false
			}
			if(keyCode === 91) {
				isCtrlAndCommand.command = false
			}
			
		})

		$('#upload-bg input').change(function(e) {
			// var data = new FormData()
			// data.append('bg')
			var file = e.target.files[0],
				reader = new FileReader(),
				URL = window.URL || window.webkitURL,
				blobUrl
			reader.onload = function(e) {
				var result = e.target.result
				self.$container.css({
					backgroundImage: 'url(' + result +  ')'
				})
			}
			reader.readAsDataURL(file)


		})
	}

	Signature.prototype.initToolbarEvent = function() {
		var self = this,
			$fontList = $('#fontList'),
			$colorPicker = $('#colorPicker')

		self.$imageUploadInput = $('.toolbar-image-upload > input'),
		self.$fontSizeInput = $('.toolbar-font-size input'),
		self.$toolbarFontFamily = $('.toolbar-font-family'),
		self.$toolbarFontColor = $('.toolbar-font-color')
		self.$toolbarFontSize = $('.toolbar-font-size')
		self.$toolbarImageUpload = $('.toolbar-image-upload')
		self.$toolbarFontWeight = $('.toolbar-font-weight')
		self.$toolbarFontStyle = $('.toolbar-font-style')

		var $colorInput = self.$toolbarFontColor.find('input')

		self.$toolbarFontColor.click(function(e) {
			var $this = $(this),
				$target = $(e.target)
			
			if($this.hasClass('selected')) {
				$this.removeClass('selected')
				$colorPicker.hide()
			} else {
				$this.addClass('selected')				
				$colorPicker.show()	
			}
		})

		$colorPicker.find('.color-list > div').on({
			click: function() {
				var bgColor = $(this).css('background-color')
				self.$toolbarFontColor.find('.font-color').css({
					backgroundColor: bgColor
				})
				self.$focusCtx.css({
					color: bgColor
				})
			},
			mouseover: function() {
				var color = $(this).css('backgroundColor'),
					hexColor = helper.rgb2hex(color)

				$colorInput.val(hexColor.slice(1)) 
			}
		})

		$colorInput.on({
			click: function(e) {
				e.stopPropagation()
			},
			keyup: function(e) {
				e.stopPropagation()
				var keyCode = e.keyCode
				if(keyCode === 13) {      // 颜色输入框按下enter键时
					var value = $(this).val(),
						color = '#' + value
					if(helper.isColor(color)) {
						$colorPicker.hide()
						$(this).removeClass('selected')
						self.$toolbarFontColor.find('.font-color').css({
							backgroundColor: color
						})
						self.$focusCtx.css({
							color: color
						})
						self.$toolbarFontColor.removeClass('selected')
					} else {
						// 提示用户颜色值输入不合法
						$(this).css({
							borderColor: 'red'
						})
					}
				}
			}
		})

		self.$toolbarFontFamily.click(function() {
			var $this = $(this)
			if($this.hasClass('selected')) {
				$this.removeClass('selected')
				$fontList.hide()
			} else {
				$this.addClass('selected')
				$fontList.show()
			}
		})

		$fontList.find('li').click(function() {
			var fontFamily = $(this).text()
			self.$toolbarFontFamily.find('.dropdown-content-text').text(fontFamily)
			self.$focusCtx.css({
				fontFamily: fontFamily
			})
			$fontList.hide()

		})

		self.$imageUploadInput.on('change', function(e) {
			var file = e.target.files[0],
				reader = new FileReader(),
				URL = window.URL || window.webkitURL,
				blobUrl

			reader.onload = function(e) {
				var result = e.target.result
				self.$focusCtx.find('img').attr('src', result)
			}
			reader.readAsDataURL(file)
		})	

		self.$toolbarFontSize.find('.spinner-up').click(function() {
			var fontSize = parseFloat(self.$fontSizeInput.val())
			if(fontSize === 100) {
				return
			}
			var fontSizeStr = ++fontSize + 'px'
			self.$fontSizeInput.val(fontSizeStr)
			self.$focusCtx.css({
				fontSize: fontSizeStr
			})
			self._updateDateByEle(self.$focusCtx)
		})

		self.$toolbarFontSize.find('.spinner-down').click(function() {
			var fontSize = parseFloat(self.$fontSizeInput.val())
			if(fontSize === 12) { 
				return
			}
			var fontSizeStr = --fontSize + 'px'
			self.$fontSizeInput.val(fontSizeStr)
			self.$focusCtx.css({
				fontSize: fontSizeStr
			})
			self._updateDateByEle(self.$focusCtx)

		})

		self.$toolbarFontStyle.click(function() {
			var $this = $(this)
			if($this.hasClass('selected')) {
				$this.removeClass('selected')
				self.$focusCtx.css({
					fontStyle: 'normal'
				})
			} else {
				$this .addClass('selected')
				self.$focusCtx.css({
					fontStyle: 'italic'
				})
			}
			self._updateDateByEle(self.$focusCtx)
		})

		self.$toolbarFontWeight.click(function() {
			var $this = $(this)
			if($this.hasClass('selected')) {
				$this.removeClass('selected')
				self.$focusCtx.css({
					fontWeight: 'normal'
				})
			} else {
				$this.addClass('selected')
				self.$focusCtx.css({
					fontWeight: 'bold'
				})
			}
			self._updateDateByEle(self.$focusCtx)
		})
		// 初始化工具栏的所有事件后，重置工具栏
		self._resetToolbar()
	}

	Signature.prototype.initPropsEvent = function() {
		var self = this,
			$props = self.$props.find('.props-item')
		$props.on('dragstart', function(e) {
			var $this = $(this),
				label = $this.attr('data-label'),
				type = $this.attr('data-type')

			self.propsInfo.label = label
			self.propsInfo.type = type
		})
	}

	Signature.prototype.initContainerEvent = function() {
		var self = this
		self.$container.on({
			dragover: function(e) {
				e.preventDefault()
				self.$container.addClass('over')
			},
			dragleave: function(e) {
				self.$container.removeClass('over')
			},
			drop: function(e) {
				self.$container.removeClass('over')

				var label = self.propsInfo.label,
					type = self.propsInfo.type

				var html = ''
				if(type === 'text') {
					html = TMPL_CONFIG.propTextTmpl.replace('{{label}}', label)
												   .replace('{{type}}', type)
												   .replace('{{prefix}}', config[label].prefix)
												   .replace('{{value}}', config[label].default)
				} else if(type === 'image') {
					html = TMPL_CONFIG.propImageTmpl.replace('{{label}}', label)
												    .replace('{{type}}', type)
				}
				var styles = {},
					$ele = $(html),
					width, height, left, top

				self.$container.append($ele)
				width = $ele.width()
				height = $ele.height()
				left = e.offsetX - (width / 2)
				top = e.offsetY - (height / 2)
				if(type === 'text') {
					styles = {
						left: e.offsetX - (width / 2),
						top: e.offsetY - (height / 2),
						fontFamily: config[label].fontFamily,
						fontSize: config[label].fontSize + 'px',
						color: config[label].color,
						cursor: 'move'
					}
				} else if(type === 'image') {
					styles = {
						left: e.offsetX - (width / 2),
						top: e.offsetY - (height / 2),
						cursor: 'move'
					}
				}
				self.$container.find('[data-role="label"]').removeClass('selected')
				$ele.css(styles).addClass('selected')
				self.$focusCtx = $ele
				self.initStaffs($ele)
				self._adjustToolbar(type, styles)
				self._rewriteConsole(left, top)
			},
			click: function(e) {
				self.$contextMenu.hide()
			},
			contextmenu: function(e) {
				e.preventDefault()
				e.stopPropagation()
			}
		})
		self.$container.on('contextmenu', '[data-role="label"]', function(e) {
			e.preventDefault()
			e.stopPropagation()

			var $this = $(this),
				position = $this.position()
				
			// 防止触发拖拽事件
			$(document).off('mousemove mouseup')
			self.$contextMenuCtx = $this
			position.left += e.offsetX
			position.top += e.offsetY

			self._showContextMenu(position)
		})
		
		self.$contextMenu.on('click', 'a', function() {
			var $target = $(this),
				action = $target.attr('data-action')
			if(action === 'alter') {
				
			} else if(action === 'delete') {
				self._deleteEle(self.$contextMenuCtx)
			}

		})
		self.$container.on('mousedown', '[data-role="label"]', function() {

			var $this = $(this),
				label = $this.attr('data-label'),
				type = $this.attr('data-type'),
				styles = $this.css([
							'fontFamily',
							'fontSize',
							'fontWeight',
							'fontStyle',
							'color',
							'left',
							'top'
						])
			
			self.$container.find('[data-role="label"]').removeClass('selected')
			$this.addClass('selected')
			self._rewriteConsole(parseFloat(styles.left), parseFloat(styles.top))
			self._adjustToolbar(type, styles)
		})
	}
	Signature.prototype.initStaffs = function($ele) {
		var self = this
		$ele.each(function() {
			var $this = $(this),
				position = $this.position(),
				width = $this.width(),
				height = $this.height(),
				key = helper.generateUUID(),  // uuid => key
				coordinate
			$this.data('key', key)
			coordinate = self._getKeyPlace(width, height, position.left, position.top)
			self._addData(key, coordinate)
			self._bindEvent($this)
		})

	}
	Signature.prototype.saveData = function() {
		var $container = this.$container,
			$labels = $container.find('[data-role="label"]'),
			data = {}
		$labels.each(function() {
			var $this = $(this),
				type = $this.attr('data-type'),
				label = $this.atte('data-label'),
				styles = {}


		})

	}
	Signature.prototype._adjustToolbar = function(type, styles) {
		this._resetToolbar()

		if(type === 'text') {
			$('.toolbar-button').removeClass('disabled')

			this.$fontSizeInput.val(styles.fontSize)
			this.$toolbarFontFamily.find('.dropdown-content-text').text(styles.fontFamily)
			this.$toolbarFontColor.find('.font-color').css({
				backgroundColor: styles.color
			})
			this.$toolbarImageUpload.addClass('disabled')
			if(styles.fontWeight === 'bold') {
				this.$toolbarFontWeight.addClass('selected')
			} else {
				this.$toolbarFontWeight.removeClass('selected')
			}
			if(styles.fontStyle === 'italic') {
				this.$toolbarFontStyle.addClass('selected')
			} else {
				this.$toolbarFontStyle.removeClass('selected')
			}
		} else if(type === 'image') {
			this.$toolbarImageUpload.removeClass('disabled')
		}
	}

	Signature.prototype._resetToolbar = function() {
		this.$toolbarFontSize.addClass('disabled')
		this.$toolbarFontFamily.addClass('disabled')
		this.$toolbarFontColor.addClass('disabled')
		this.$toolbarImageUpload.addClass('disabled')
		this.$toolbarFontWeight.removeClass('selected').addClass('disabled')
		this.$toolbarFontStyle.removeClass('selected').addClass('disabled')
	}


	Signature.prototype._getKeyPlace = function(w, h, l, t) {

		return [
			parseInt(l + (w / 2), 10),		    //   center-x
			parseInt(t + (h / 2), 10),		    //	 center-y
			parseInt(t, 10),					//	 top
			parseInt(t + h, 10),				//	 bottom
			parseInt(l, 10),					//   left
			parseInt(l + w, 10)				    //	 right
		]
	}
	Signature.prototype._updateDateByEle = function($ele) {
		var width = $ele.width(),
			height = $ele.height(),
			position = $ele.position(),
			key = $ele.data('key'),
			coordinate = this._getKeyPlace(width, height, position.left, position.top)
		this._addData(key, coordinate)
	}

	Signature.prototype._addData = function(key, coordinate) {
		this.data[key] = coordinate
	}


	Signature.prototype._refreshCanvas = function(key, coordinate) {
		var i = 0, j = 0,
			k, len, data
		// 先把辅助线全部删除
		this.snapLines.length = 0

		len = coordinate.length
		
		for(; i < len; i++) {
			// 检测是否与与绘制面板中心区域对齐
			if(coordinate[0] === this.globalCenter[0] || coordinate[1] === this.globalCenter[1]) {
				if(coordinate[0] === this.globalCenter[0]) {
					this.snapLines.push({
						dir: 'x',
						position: coordinate[0]
					})
				} else if(coordinate[1] === this.globalCenter[1]) {
					this.snapLines.push({
						dir: 'y',
						position: coordinate[1]
					})
				}
				break
			}
			for(k in this.data) {
				if(k === key) {
					continue
				}
				data = this.data[k]

				//比较当前移动的物体的x轴中心点、x轴左变、x轴右边是否和面板中的其他元素有重叠
				if(coordinate[0] === data[0]) {
					this.snapLines.push({
						dir: 'x',
						position: coordinate[0]
					})
				} else if(coordinate[4] === data[4] || coordinate[4] === data[5]) {
					this.snapLines.push({
						dir: 'x',
						position: coordinate[4]
					})
				} else if(coordinate[5] === data[4] || coordinate[5] === data[5]) {
					this.snapLines.push({
						dir: 'x',
						position: coordinate[5]
					})
				}
				//比较当前移动的物体的y轴中心点、y轴左变、y轴右边是否和面板中的欠他元素有重叠
				if(coordinate[1] === data[1]) {
					this.snapLines.push({
						dir: 'y',
						position: coordinate[1]
					})	
				} else if(coordinate[2] === data[2] || coordinate[2] === data[3]) {
					this.snapLines.push({
						dir: 'y',
						position: coordinate[2]
					})
				} else if(coordinate[3] === data[2] || coordinate[3] === data[3]) {
					this.snapLines.push({
						dir: 'y',
						position: coordinate[3]
					})
				}
			}
		}
		if(this.snapLines.length > 0) {
			this._generateSnapLines()
		}
	}

	Signature.prototype._generateSnapLines = function() {
		var i = 0, len = this.snapLines.length,
			$target = null, style = ''
		for(; i < len; i++) {
			if(this.snapLines[i].dir === 'x') {
				$target = this.$snapLineX
				style = {
					left: this.snapLines[i].position
				}
			} else {
				$target = this.$snapLineY
				style = {
					top: this.snapLines[i].position
				}
			}
			$target.show()
			$target.css(style)
		}
	}

	Signature.prototype._hideSnapLines = function() {
		this.$snapLineX.hide()
		this.$snapLineY.hide()
	}
	Signature.prototype._deleteEle = function($ele) {
		// 删除当前元素存储的坐标信息
		var key = $ele.data('key')
		delete this.data[key]
		// 重置工具栏
		this._resetToolbar()
        // 移除所有对该元素绑定的事件
		$ele.off()
		// 在DOM中删除该元素
		$ele.remove()
	}

	Signature.prototype._showContextMenu = function(position) {
		this.$contextMenu.show()
						 .css({
						 	left: position.left,
						 	top: position.top
						 })
	}
	Signature.prototype._rewriteConsole = function(left, top) {
		this.$consoleX.text(left)
		this.$consoleY.text(top)
	}
	Signature.prototype._bindEvent = function($ele) {
 
		var self = this,
			current, coordinate, key

		// click
		$ele.on('mousedown', function() {
			// 修改当前绘制面板焦点元素上下文
			self.$focusCtx = $ele
		})
		$ele.draggable({
			drag: function(w, h, l, t) {
					key = $ele.data('key')
					coordinate = self._getKeyPlace(w, h, l, t)

					self._hideSnapLines()
					self._rewriteConsole(l, t)
					self._refreshCanvas(key, coordinate)		
			},
			stop: function() {

					self._hideSnapLines()
					// 更新数据
					if(key && coordinate) {

						self.data[key] = coordinate
					}
			},
			resize: function() {
				self._updateDateByEle($(this))
			}

		})
		$ele.dblclick(function() {
			var $this = $(this),
				$innerInput = $this.find('input'),
				$innerSpan = $this.find('.label-value')
			$innerSpan.hide()
			$innerInput.show().focus().val($innerSpan.text())

			$innerInput.on('blur', function() {
				var value = $innerInput.val()
				if(!value) {
					self._deleteEle($ele)
				} else {
					$innerInput.hide()
					$innerSpan.show().text(value)
					// 在更新完画布内容的时候，重新计算当前元素的
					var width = $this.width(),
						height = $this.height(),
						position = $this.position(),
						coordinate = self._getKeyPlace(width, height, position.left, position.top),
						key = $this.data('key')
					self._addData(key, coordinate)
				}
				$innerInput.off('blur')
			})

		})
				
	}

	window.Signature = Signature

})
