(function(win, doc){
    'use strict';
    
    var getXhr = function() {
        var xhr = false;
        if (win.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (win.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch(e) {
                try {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                } catch(e) {
                    xhr = false;
                }
            }
        }
        return xhr;
    };
    
    Geocoder.Utils = {
        whiteSpaceRegex: /\s+/,
        json: function(url, data) {
            // Must encode data
            if(data && typeof(data) === 'object') {
                var y = '', e = encodeURIComponent;
                for (var x in data) {
                    y += '&' + e(x) + '=' + e(data[x]);
                }
                data = y.slice(1);
                url += (/\?/.test(url) ? '&' : '?') + data;
            }
            
            var xhr = getXhr(), when = {};
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Accept","application/json");
            xhr.onload = onload;
            xhr.onerror = onerror;
            xhr.onprogress = onprogress;
            xhr.send(null);
            
            function onload() {
                if (xhr.status === 200) {
                    when.ready.call({
                        response: JSON.parse(xhr.response)
                    });
                }
            }
            function onerror() {
                when.error.call({
                    response: "Can't xhr on url: " + url
                });
            }
            function onprogress() {}
            
            return {
                when: function(obj){
                    when.ready = obj.ready;
                    when.error = obj.error;
                }
            };
        },
        to3857: function(coord){
            return ol.proj.transform(
                [parseFloat(coord[0]), parseFloat(coord[1])], 'EPSG:4326', 'EPSG:3857'
            );
        },
        to4326: function(coord){
            return ol.proj.transform(
                [parseFloat(coord[0]), parseFloat(coord[1])], 'EPSG:3857', 'EPSG:4326'
            );
        },
        classRegex: function(classname) {
            return new RegExp('(^|\\s+)' + classname + '(\\s+|$)');
        },
        _addClass: function(el, c){
            if (el.classList)
                el.classList.add(c);
            else
                el.className = (el.className + ' ' + c).trim();
        },
        addClass: function(el, classname){
            if(Array.isArray(el)){
                el.forEach(function(each){
                    utils.addClass(each, classname);
                });
                return;
            }
            
            //classname can be ['class1', 'class2'] or 'class1 class2'
            var 
                array = (Array.isArray(classname)) ?
                    classname : classname.split(utils.whiteSpaceRegex),
                i = array.length
            ;
            while(i--){
                if(!utils.hasClass(el, array[i])) utils._addClass(el, array[i]);
            }
        },
        _removeClass: function(el, c){
            if (el.classList)
                el.classList.remove(c);
            else 
                el.className = (el.className.replace(utils.classReg(c), ' ')).trim();
        },
        removeClass: function(el, classname){
            if(Array.isArray(el)){
                el.forEach(function(each){
                    utils.removeClass(each, classname);
                });
                return;
            }
            
            //classname can be ['class1', 'class2'] or 'class1 class2'
            var 
                array = (Array.isArray(classname)) ?
                classname : classname.split(utils.whiteSpaceRegex),
                i = array.length
            ;
            while(i--){
                if(utils.hasClass(el, array[i])) utils._removeClass(el, array[i]);
            }
        },
        hasClass: function(el, c){
            return (el.classList) ? 
                el.classList.contains(c) : utils.classReg(c).test(el.className);
        },
        toggleClass: function(el, c){
            if(Array.isArray(el)){
                el.forEach(function(each){
                    utils.toggleClass(each, c);
                });
                return;
            }
            
            if(el.classList)
                el.classList.toggle(c);
            else
                utils.hasClass(el, c) ? utils._removeClass(el, c) : utils._addClass(el, c);
        },
        $: function(id){
            id = (id[0] === '#') ? id.substr(1, id.length) : id;
            return doc.getElementById(id);
        },
        isElement: function(obj){
            // DOM, Level2
            if ("HTMLElement" in win) {
                return (!!obj && obj instanceof HTMLElement);
            }
            // Older browsers
            return (!!obj && typeof obj === "object" && 
            obj.nodeType === 1 && !!obj.nodeName);
        },
        getAllChildren: function(node, tag){
            return [].slice.call(node.getElementsByTagName(tag));
        },
        emptyArray: function(array){
            while(array.length) array.pop();
        },
        removeAllChildren: function(node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        },
        removeAll: function(collection) {
            var node;
            while (node = collection[0])
                node.parentNode.removeChild(node);
        },
        getChildren: function(node, tag){
            return [].filter.call(node.childNodes, function(el) {
                return (tag) ? 
                    el.nodeType == 1 && el.tagName.toLowerCase() == tag
                    :
                    el.nodeType == 1;
            });
        },
        template: function(html, row){
            var this_ = this;
            
            return html.replace(/\{ *([\w_-]+) *\}/g, function (html, key) {
                var value = (row[key]  === undefined) ? '' : row[key];
                return this_.htmlEscape(value);
            });
        },
        htmlEscape: function(str){
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, "&#039;");
        },
        /**
        * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
        * @returns obj3 a new object based on obj1 and obj2
        */
        mergeOptions: function(obj1, obj2){
            var obj3 = {};
            for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
            for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
            return obj3;
        },
        createElement: function(node, html){
            var elem;
            if(Array.isArray(node)){
                elem = doc.createElement(node[0]);
                
                if(node[1].id) elem.id = node[1].id;
                if(node[1].classname) elem.className = node[1].classname;
                
                if(node[1].attr){
                    var attr = node[1].attr;
                    if(Array.isArray(attr)){
                        var i = -1;
                        while(++i < attr.length){
                            elem.setAttribute(attr[i].name, attr[i].value);
                        }
                    } else {
                        elem.setAttribute(attr.name, attr.value);
                    }
                }
            } else{
                elem = doc.createElement(node);
            }
            elem.innerHTML = html;
            var frag = doc.createDocumentFragment();
            
            while (elem.childNodes[0]) {
                frag.appendChild(elem.childNodes[0]);
            }
            elem.appendChild(frag);
            return elem;
        }
    };
})(win, doc);