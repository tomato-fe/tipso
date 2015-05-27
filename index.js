;!function ($) {
    'use strict';
    
    var defaults = {
		theme           : '',
		arrow           : 7,
        type            : 'hover',  
		delay           : 200,
        container       : null,
		content         : null,
		onBeforeShow    : null,
		onShow          : null,
		onHide          : null
    }

    var eventMap = {
        hover: {
            showEvent: 'mouseover',
            hideEvent: 'mouseout'
        },
        focus: {
            showEvent: 'focus',
            hideEvent: 'blur'
        }
    }

    var __plugName__ = 'tc.poptip'

    var template = '' + __inline('tip.tpl')

    function Poptip(element, options) {
    	this.element = $(element)
        // 提取 data 设置
        var dataApi = _getDataApi(this.element)

    	this.settings = $.extend({}, defaults, dataApi, options)
    	this._title = this.element.attr('title')
        this.mode = 'hide'

    	this.init()
    }

    function _getDataApi($element) {
        var ret = {},
            data = $element.data(),
            prop, 
            val
        if (data) {
            for(prop in data) {
                if (prop.substr(0, 6) === 'poptip') {
                    val = data[prop]
                    prop = prop.substr(6).toLowerCase()
                    if (defaults[prop]) {
                        ret[prop] = val
                    }
                }
            } 
        }
        return ret       
    }

    
    $.extend(Poptip.prototype, {
    	init: function() {
    		var obj = this,
    			$el = this.element,
                triggerType = this.settings.type

            $el.removeAttr('title')
            if (triggerType === 'click') {
                $el.on('click.' + __plugName__, function(e) {
                    obj.toggle()
                })
                $(document).on('click.' + __plugName__, function(e) {
                    if (obj.mode == 'show' && e.target !== obj.element[0]) {
                        obj.hide()
                    }
                });
            } else {
                var eventObj = eventMap[triggerType] || eventMap['hover']
        		$el.on(eventObj.showEvent + '.' + __plugName__, function() {
        			obj.show()
        		})
        		$el.on(eventObj.hideEvent + '.' + __plugName__, function() {
        			obj.hide()
        		})
            }
    	},
        _bubble: function() {
            if (!this.tip_bubble) {
                this.tip_bubble = $(template).appendTo('body');
            }
            return this.tip_bubble
        },
    	show: function() {
            var obj = this
            if (obj.mode == 'hide') {
                var bubble = obj._bubble()
                obj.content().reposition()

                $.isFunction(obj.settings.onBeforeShow) && obj.settings.onBeforeShow( obj )

                obj.timeout = window.setTimeout(function() {
                    bubble.show()
                    $.isFunction(obj.settings.onShow) && obj.settings.onShow( obj )
                    obj.mode = 'show'
                }, obj.settings.delay)
            }
    	},
        hide: function() {
            var obj = this

            window.clearTimeout(obj.timeout);
            obj.timeout = null;
            obj.tip_bubble.hide()
            $.isFunction(obj.settings.onHide) && obj.settings.onHide( obj )
            obj.mode = 'hide'
        },
        toggle: function() {
            this.mode == 'hide' ? this.show() : this.hide()
        },
        content: function(msg) {
            var bubble = this._bubble(),
                $el = this.element,
                settings = this.settings,
                ctn = bubble.find('[data-role="content"]')

            if (msg != null) {
                settings.content = msg + ''
            } 
            if (settings.content === null) {
                settings.content = $el.data('poptip-content')
            }
            ctn && ctn.html(settings.content)

            if (msg != null) {
                this.reposition()
            } 
            return this
        },
        reposition: function() {
            var arrow = parseInt(this.settings.arrow, 10),
                bubble = this.tip_bubble

            var positionMap = this._getPosition(arrow)

            positionMap = this._makesureInViewport( positionMap )

            this._renderArrow(positionMap.arrow)
            bubble.css( {
                left: positionMap.left,
                top: positionMap.top
            } )
            return this
        },
        destroy: function() {
            var $el = this.element

            $el.off('.' + __plugName__)
            $el.removeData(__plugName__)
            $el.attr('title', this._title)
        },
        _getPosition: function(arrow) {
            var $el = this.element,
                bubble = this.tip_bubble,
                elPosi = $el.offset(),
                positionMap = {
                    arrow: arrow,
                    left: elPosi.left,
                    top: elPosi.top,
                    right: elPosi.left,
                    bottom: elPosi.top
                },
                direction = '',
                gap = 10,
                arrowShift = 0,
                w = bubble.outerWidth(),
                h = bubble.outerHeight()
            switch(arrow) {
                case 10:
                    direction = 'right'
                    break;
                case 11:
                    direction = 'bottom'
                    break;
                case 1:
                    direction = 'bottom'
                    arrowShift = $el.outerWidth() - w
                    break;
                case 2:
                    direction = 'left'
                    break;
                case 5:
                    direction = 'top'
                    arrowShift = $el.outerWidth() - w
                    break;
                default: // 7
                    direction = 'top'
            }

            switch(direction) {
                case 'top':
                    positionMap.top -= (h + gap)
                    positionMap.left +=  arrowShift
                    break;
                case 'bottom':
                    positionMap.top += ($el.outerHeight() + gap)
                    positionMap.left +=  arrowShift
                    break;
                case 'left':
                    positionMap.left -= ( w + gap )
                    break;
                case 'right':
                    positionMap.left += ( $el.outerWidth() + gap )
                    break;
            }

            positionMap.right = positionMap.left + w
            positionMap.bottom = positionMap.top + h

            return positionMap
        },
        _makesureInViewport: function (positionMap) {
            var direct = {
                    'left': 0,
                    'top': 1,
                    'right': 2,
                    'bottom': 3
                },
                arrowMap = {
                    '1': 5,
                    '5': 1,
                    '7': 11,
                    '11': 7,
                    '10': 2,
                    '2': 10
                },
                ap = positionMap.arrow,
                $container = this.settings.container ? $(this.settings.container) : null,
                rs = positionMap,
                changeAp,
                containment
            // $container
            if ($container && $container.length) {
                var posi = $container.offset(),
                    h =   $container.outerHeight(),
                    w = $container.outerWidth()  
                containment = [posi.left, posi.top, posi.left + w, posi.top + h]
            } else {
                // window
                var $win = $(window),
                    left = $win.scrollLeft(),
                    top = $win.scrollTop(),
                    h =   $win.outerHeight(),
                    w = $win.outerWidth()
                containment = [left, top, left + w, top + h]
            }

            if ( (ap == 7 || ap == 5) && (containment[direct.top] > positionMap.top) ) {
                // tip 溢出屏幕上方
                changeAp = arrowMap[ap]
            } else if( (ap == 11 || ap == 1) && (containment[direct.bottom] < positionMap.bottom) ) {
                // tip 溢出屏幕下方
                changeAp = arrowMap[ap]
            } else if( (ap == 10) && (containment[direct.right] < positionMap.right) ) {
                // tip 溢出屏幕右边
                changeAp = arrowMap[ap]
            } else if( (ap == 2 ) && (containment[direct.left] > positionMap.left) ) {
                // tip 溢出屏幕左边
                changeAp = arrowMap[ap]
            }
            if (changeAp) {
                rs = this._getPosition(changeAp)
            }
            return rs
        },
        _renderArrow: function(arrow) {
            var bubble = this.tip_bubble,
                prev = bubble.data('poptip-arrow-current')
            bubble.find('.ui-poptip-arrow').removeClass('ui-poptip-arrow-' + prev).addClass('ui-poptip-arrow-' + arrow)
            bubble.data('poptip-arrow-current', arrow)
        }
    })

    // PLUG 定义
    // ==========================
    function Plugin(option, params) {
        this.each(function () {
            var $this = $(this),
                data  = $this.data(__plugName__),
                options

            if (typeof option === 'object') 
                options = option

            if (!data) $this.data(__plugName__, (data = new Poptip(this, options) ) );

            if (typeof option === 'string') 
                data[option](params)
        })
    }

    $.fn.poptip = Plugin
    $.fn.poptip.Constructor = Poptip
}(jQuery);