let timelinePoints = ['기본 설정'];
let groupColors = {}; 

let goldenHue = Math.random();
function generateDistinctColor() {
    goldenHue += 0.618033988749895; 
    goldenHue %= 1;
    return `hsl(${Math.floor(goldenHue * 360)}, 65%, 55%)`; 
}

function getGroupColor(groupName, isMain) {
    if (isMain === '천성현') return '#ea7271'; 
    if (!groupName) return generateDistinctColor();
    if (!groupColors[groupName]) groupColors[groupName] = generateDistinctColor(); 
    return groupColors[groupName];
}

const deathIcon = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><line x1="20" y1="20" x2="80" y2="80" stroke="%23e03e3e" stroke-width="15" stroke-linecap="round"/><line x1="80" y1="20" x2="20" y2="80" stroke="%23e03e3e" stroke-width="15" stroke-linecap="round"/></svg>';

function syncFromInput(val) { document.getElementById('edgeFrom').value = val; }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); setTimeout(() => { cy.resize(); }, 300); }

// UI 생존/사망 토글
function toggleDeathTime(status) {
    document.getElementById('deathTimeBox').style.display = status === 'dead' ? 'block' : 'none';
}

const layoutConfig = {
    name: 'fcose', quality: 'proof', animate: true, animationDuration: 800,
    nodeDimensionsIncludeLabels: true, randomize: false, 
    nodeRepulsion: node => 1000000, idealEdgeLength: edge => 140, 
    gravity: 0.1, nodeSeparation: 80, packComponents: true
};

let cy = cytoscape({
    container: document.getElementById('cy'),
    minZoom: 0.1, maxZoom: 4,
    style: [
        { selector: 'node', style: { 
            'label': 'data(label)', 'background-color': 'data(color)', 
            'color': '#fff', 'text-valign': 'center', 'text-halign': 'center', 'font-family': 'inherit', 
            'font-size': '14px', 'font-weight':'600', 'width': 'label', 'height': 'label', 'padding': '16px', 
            'shape': 'data(shape)', 'transition-property': 'opacity', 'transition-duration': '0.3s',
            'text-wrap': 'wrap', 'text-max-width': '150px' 
        }},
        { selector: '.group-box, :parent', style: { 
            'background-color': '#ffffff', 'background-opacity': 0.5, 'border-color': '#d3d1cb', 
            'border-width': 2, 'border-style': 'dashed', 'label': 'data(id)', 'text-valign': 'top', 
            'padding': '30px', 'font-size': '16px', 'font-weight':'bold', 'color':'#555', 
            'shape': 'round-rectangle', 'text-margin-y': -10 
        }},

        { selector: '.node-dead', style: {
            'background-image': deathIcon, 'background-fit': 'cover',
            'opacity': 0.6, 'border-color': '#e03e3e', 'border-width': 4
        }},

        /* ---------------- [ 관계선 스타일 4종 ] ---------------- */
        { selector: 'edge', style: { 
            'label': 'data(label)', 'width': 2.5, 'line-color': '#a3a19a', 'target-arrow-color': '#a3a19a', 
            'target-arrow-shape': 'triangle', 'curve-style': 'unbundled-bezier', 
            'control-point-distances': function(ele){ return ele.data('cpd') || 40; }, 'control-point-weights': 0.5, 
            'edge-text-rotation': 'autorotate', 'font-size': '11px', 'font-weight':'600', 'color': '#555', 
            'text-background-color': '#ffffff', 'text-background-opacity': 0.8, 'text-background-padding': '4px'
        }},
        { selector: '.style-regular', style: { 'width': 2.5, 'line-style': 'solid' }},
        { selector: '.style-thick', style: { 'width': 6, 'font-size': '13px' }},
        { selector: '.style-dashed', style: { 'line-style': 'dashed', 'line-dash-pattern': [6, 6] }},
        
        /* ✨ W 지그재그를 다중선에 맞춰 밀어내기 적용 (segDist 데이터 활용) */
        { selector: '.style-conflict', style: { 
            'curve-style': 'segments',
            'segment-weights': '0.125 0.25 0.375 0.5 0.625 0.75 0.875',
            'segment-distances': function(ele){ return ele.data('segDist') || '15 -15 15 -15 15 -15 15'; }, 
            'line-color': '#e03e3e', 'target-arrow-color': '#e03e3e', 'target-arrow-shape': 'triangle',
            'color': '#e03e3e', 'width': 2, 'font-size': '13px', 'font-weight': 'bold',
            'text-background-color': '#fff0f0'
        }},
        
        { selector: '.affiliation-edge', style: { 'line-style': 'dashed', 'line-dash-pattern': [4, 4], 'width': 3, 'line-color': '#9b59b6', 'target-arrow-color': '#9b59b6', 'target-arrow-shape': 'circle', 'color': '#9b59b6', 'font-size': '11px' }},
        
        { selector: '.bidir', style: { 'source-arrow-shape': 'triangle', 'source-arrow-color': 'data(line_color_override)' }},
        { selector: '.style-conflict.bidir', style: { 'source-arrow-color': '#e03e3e' } }, 
        
        { selector: ':selected', style: { 'border-width': 4, 'border-color': '#eeb868', 'line-color': '#eeb868', 'target-arrow-color': '#eeb868', 'source-arrow-color': '#eeb868' }},
        { selector: '.pov-dim', style: { 'opacity': 0.15, 'grayscale': 1 } },
        { selector: '.pov-focus', style: { 'opacity': 1 } },
        { selector: '.pov-center', style: { 'opacity': 1, 'border-width': 6, 'border-color': '#e03e3e', 'underlay-color': '#e03e3e', 'underlay-padding': '8px', 'underlay-opacity': 0.3, 'color': '#ffffff', 'text-outline-width': 3, 'text-outline-color': '#e03e3e', 'font-size': '18px' }}
    ]
});

// 양방향 색상 해킹
cy.on('add', 'edge', function(evt){
    let edge = evt.target;
    if(edge.hasClass('style-conflict')) edge.data('line_color_override', '#e03e3e');
    else edge.data('line_color_override', '#a3a19a');
});

// [✨ 선 겹침 완벽 차단 수학적 오프셋 계산기]
function calculateEdgeOffset(from, to) {
    let edges = cy.edges(`[source="${from}"][target="${to}"], [source="${to}"][target="${from}"]`);
    let count = edges.length;
    if (count === 0) return 40; // 첫 번째 선
    let sign = count % 2 === 0 ? 1 : -1;
    let step = 40 + Math.floor(count / 2) * 40; // 40, -40, 80, -80, 120...
    return sign * step;
}

// 갈등선(W)의 지그재그 배열 생성
function getConflictSegDist(baseOffset) {
    let dists = [];
    let toggle = 15; // W모양의 꺾임 폭
    for(let i=0; i<7; i++) {
        dists.push(baseOffset + toggle);
        toggle = -toggle;
    }
    return dists.join(' ');
}

function getShapeByGender(gender) {
    if(gender === 'male') return 'rectangle';
    if(gender === 'female') return 'ellipse';
    return 'round-rectangle'; 
}

function clearInputForms() {
    document.getElementById('nodeName').value = ''; 
    document.getElementById('nodeGroup').value = '';
    document.getElementById('nodeNotion').value = '';
    document.getElementById('nodeMemo').value = '';
    
    document.getElementById('edgeFrom').value = ''; 
    document.getElementById('edgeTo').value = '';
    document.getElementById('edgeLabel').value = ''; 
    
    document.querySelector('input[name="edgeStyle"][value="style-regular"]').checked = true; 
    document.querySelector('input[name="edgeDirection"][value="directed"]').checked = true; 
    
    document.getElementById('edgeEnd').value = '-1';
}

function getSmartSpawnPosition(primaryGroup) {
    let elements = cy.elements();
    if (elements.length === 0) { let ext = cy.extent(); return { x: ext.x1 + ext.w/2, y: ext.y1 + ext.h/2 }; }
    if (primaryGroup && cy.getElementById(primaryGroup).length > 0) {
        let siblings = cy.nodes(`node[parent="${primaryGroup}"]`);
        if (siblings.length > 0) { let sPos = siblings[siblings.length - 1].position(); return { x: sPos.x + 90, y: sPos.y + 90 }; }
    }
    let bbox = elements.boundingBox();
    return { x: bbox.x2 + 150, y: bbox.y1 + 100 + (Math.random() * 100) };
}

function ensureGroupExists(groupName) {
    if (groupName && cy.getElementById(groupName).length === 0) cy.add({ data: { id: groupName }, classes: 'group-box' }); 
}

function updateAffiliations(nodeId, secondaryGroups) {
    cy.edges(`edge[source="${nodeId}"][type="affiliation"]`).remove(); 
    secondaryGroups.forEach(sg => {
        ensureGroupExists(sg);
        cy.add({ data: { id: `${nodeId}-affil-${sg}`, source: nodeId, target: sg, label: '이중소속', type: 'affiliation', cpd: -50 }, classes: 'affiliation-edge' });
    });
}

function autoAddCharacter(targetName, isFromForm = false) {
    let groupStr = isFromForm ? document.getElementById('nodeGroup').value.trim() : '';
    let memo = isFromForm ? document.getElementById('nodeMemo').value.trim() : '';
    let notion = isFromForm ? document.getElementById('nodeNotion').value.trim() : '';
    let gender = isFromForm ? document.getElementById('nodeGender').value : 'unspecified';
    
    let isAutoColor = isFromForm ? document.getElementById('autoColorCheck').checked : true;
    let finalColor = '';
    let groups = groupStr ? groupStr.split(',').map(s => s.trim()).filter(s => s) : [];
    let primaryGroup = groups.length > 0 ? groups[0] : null;

    if (isFromForm && !isAutoColor) {
        finalColor = document.getElementById('nodeColor').value;
    } else {
        finalColor = getGroupColor(primaryGroup, targetName);
    }

    ensureGroupExists(primaryGroup);

    cy.add({ 
        data: { id: targetName, label: targetName, parent: primaryGroup, allGroups: groups, notion: notion, memo: memo, color: finalColor, gender: gender, shape: getShapeByGender(gender), deathIdx: -1, status: 'alive' },
        position: getSmartSpawnPosition(primaryGroup)
    });

    updateAffiliations(targetName, groups.slice(1)); 
}

function addCharacter() {
    let name = document.getElementById('nodeName').value.trim();
    if (!name) return alert("이름을 입력하세요!");
    if (cy.getElementById(name).length > 0) return alert("이미 있는 인물입니다.");
    
    autoAddCharacter(name, true);
    saveData(); clearInputForms();
    if(cy.nodes().length <= 2) fitCanvas();
}

function addRelationship() {
    let from = document.getElementById('edgeFrom').value.trim();
    let to = document.getElementById('edgeTo').value.trim();
    let label = document.getElementById('edgeLabel').value.trim();
    let startIdx = parseInt(document.getElementById('edgeStart').value);
    let endIdx = parseInt(document.getElementById('edgeEnd').value);
    
    let styleClass = document.querySelector('input[name="edgeStyle"]:checked').value;
    let isBidir = document.querySelector('input[name="edgeDirection"]:checked').value === 'bidirected';
    
    if (!from || !to) return alert("연결할 대상을 입력하세요.");
    if (endIdx !== -1 && endIdx <= startIdx) return alert("종료 시점은 시작 시점보다 나중이어야 합니다.");

    if (cy.getElementById(from).length === 0) autoAddCharacter(from, from === document.getElementById('nodeName').value.trim());
    if (cy.getElementById(to).length === 0) autoAddCharacter(to);

    // ✨ 선 겹침 차단: 이미 몇 개의 선이 있는지 파악 후 오프셋 적용
    let cpdVal = calculateEdgeOffset(from, to);
    let segDistVal = getConflictSegDist(cpdVal);
    
    let classesArray = [styleClass];
    if (isBidir) classesArray.push('bidir');

    cy.add({ 
        data: { source: from, target: to, label: label, startIdx: startIdx, endIdx: endIdx, cpd: cpdVal, segDist: segDistVal }, 
        classes: classesArray.join(' ') 
    });
    
    saveData(); clearInputForms(); updateTimelineDisplay(document.getElementById('timelineRange').value);
}

function fitCanvas() { cy.fit(cy.elements(), 50); }
function autoArrange() {
    let selected = cy.$(':selected');
    if(selected.length > 0 && selected[0].isNode() && !selected[0].isParent()) {
        let centerNode = selected[0];
        cy.layout({ name: 'concentric', fit: true, animate: true, animationDuration: 500, nodeDimensionsIncludeLabels: true, minNodeSpacing: 80, concentric: function(node) { if (node.id() === centerNode.id()) return 3; if (node.edgesWith(centerNode).length > 0) return 2; return 1; }, levelWidth: function() { return 1; } }).run();
    } else {
        cy.layout(layoutConfig).run();
    }
}

function addTimePoint() {
    let newVal = document.getElementById('newTimePoint').value.trim();
    if(!newVal) return;
    timelinePoints.push(newVal); document.getElementById('newTimePoint').value = '';
    syncTimelineUI(); saveData(); 
}

function syncTimelineUI() {
    let startSel = document.getElementById('edgeStart');
    let endSel = document.getElementById('edgeEnd');
    let deathSel = document.getElementById('editDeath');
    
    startSel.innerHTML = ''; endSel.innerHTML = '<option value="-1">계속 유지 (종료 안됨)</option>'; deathSel.innerHTML = '';

    timelinePoints.forEach((pt, idx) => { 
        let opt = `<option value="${idx}">${pt}</option>`;
        startSel.innerHTML += opt;
        endSel.innerHTML += opt;
        deathSel.innerHTML += opt;
    });
    document.getElementById('timelineRange').max = timelinePoints.length;
}

function updateTimelineDisplay(val) {
    let currentIdx = parseInt(val) - 1; 
    document.getElementById('chapterDisplay').innerText = timelinePoints[currentIdx];
    
    cy.edges().forEach(edge => { 
        let start = edge.data('startIdx') || 0; 
        let end = edge.data('endIdx') !== undefined ? edge.data('endIdx') : -1;
        
        let isVisible = (currentIdx >= start) && (end === -1 || currentIdx < end);
        edge.style('display', isVisible ? 'element' : 'none'); 
    });

    cy.nodes().forEach(node => {
        if(node.isParent() || node.hasClass('group-box')) return;
        let status = node.data('status') || 'alive';
        let death = node.data('deathIdx') !== undefined ? node.data('deathIdx') : -1;
        
        if(status === 'dead' && death !== -1 && currentIdx >= death) { node.addClass('node-dead'); } 
        else { node.removeClass('node-dead'); }
    });
}

let currentNode = null;
cy.on('tap', 'node', function(evt){
    let node = evt.target;
    if (node.isParent() || node.hasClass('group-box')) return; 
    currentNode = node;
    
    let clickedId = node.data('id');
    let fromInput = document.getElementById('edgeFrom');
    if (!fromInput.value || fromInput.value === clickedId) { fromInput.value = clickedId; } else { document.getElementById('edgeTo').value = clickedId; }

    populateDetailsPanel(node);
});

function populateDetailsPanel(node) {
    toggleEditMode(false); document.getElementById('detailsPanel').classList.add('open');
    
    let isDead = node.hasClass('node-dead');
    document.getElementById('detailName').innerText = (node.data('label') || node.data('id')) + (isDead ? " (사망 ✝)" : "");
    document.getElementById('detailMemo').innerText = node.data('memo') || '메모가 없습니다.';
    let btnNotion = document.getElementById('btnNotion');
    if (node.data('notion')) { btnNotion.style.display = 'block'; btnNotion.onclick = () => window.open(node.data('notion'), '_blank'); } else { btnNotion.style.display = 'none'; }

    let groups = node.data('allGroups') || [];
    if (!Array.isArray(groups) && node.data('parent')) groups = [node.data('parent')];
    let tagHTML = '';
    if (groups.length === 0) { tagHTML = '<span class="tag">무소속</span>'; } 
    else { groups.forEach((g, idx) => { tagHTML += `<span class="tag ${idx === 0 ? 'primary' : ''}">${g}${idx===0 ? ' (메인)' : ''}</span>`; }); }
    document.getElementById('detailGroupTags').innerHTML = tagHTML;

    // 수정 폼 동기화
    document.getElementById('editOriginalId').value = node.data('id');
    document.getElementById('editName').value = node.data('label') || node.data('id');
    document.getElementById('editGroup').value = groups.join(', ');
    document.getElementById('editGender').value = node.data('gender') || 'unspecified';
    document.getElementById('editColor').value = node.data('color') || '#9fa6b2';
    
    let status = node.data('status') || 'alive';
    document.getElementById('editStatus').value = status;
    toggleDeathTime(status);
    if(node.data('deathIdx') !== undefined) document.getElementById('editDeath').value = node.data('deathIdx');

    document.getElementById('editNotion').value = node.data('notion') || '';
    document.getElementById('editMemo').value = node.data('memo') || '';
    
    setTimeout(() => { cy.resize(); }, 300);
}

function toggleEditMode(isEditing) {
    let panel = document.getElementById('panelContentBlock');
    if(isEditing) panel.classList.add('is-editing'); else panel.classList.remove('is-editing');
}

function saveEdits() {
    if (!currentNode) return;
    let newName = document.getElementById('editName').value.trim();
    let newGroupsStr = document.getElementById('editGroup').value.trim();
    let newGender = document.getElementById('editGender').value;
    let newColor = document.getElementById('editColor').value;
    
    let newStatus = document.getElementById('editStatus').value;
    let newDeath = parseInt(document.getElementById('editDeath').value);
    
    let newNotion = document.getElementById('editNotion').value.trim();
    let newMemo = document.getElementById('editMemo').value.trim();

    if (!newName) return alert("이름은 필수입니다.");

    let newGroups = newGroupsStr ? newGroupsStr.split(',').map(s => s.trim()).filter(s => s) : [];
    let newPrimary = newGroups.length > 0 ? newGroups[0] : null;

    ensureGroupExists(newPrimary);
    
    currentNode.data({
        'label': newName, 'allGroups': newGroups, 'notion': newNotion, 'memo': newMemo,
        'gender': newGender, 'shape': getShapeByGender(newGender), 'color': newColor, 
        'status': newStatus, 'deathIdx': newStatus === 'dead' ? newDeath : -1
    });
    
    if (currentNode.data('parent') !== newPrimary) { currentNode.move({ parent: newPrimary }); }

    updateAffiliations(newName, newGroups.slice(1)); 

    saveData(); updateTimelineDisplay(document.getElementById('timelineRange').value); populateDetailsPanel(currentNode);
}

function closeDetails() { document.getElementById('detailsPanel').classList.remove('open'); setTimeout(() => { cy.resize(); }, 300); }
function focusPOV() { let sel = cy.$(':selected'); if (sel.length === 0) return alert('캔버스에서 기준 인물을 클릭해주세요.'); let nb = sel.neighborhood(); cy.elements().removeClass('pov-focus pov-center').addClass('pov-dim'); nb.removeClass('pov-dim').addClass('pov-focus'); sel.removeClass('pov-dim pov-focus').addClass('pov-center'); }
function resetPOV() { cy.elements().removeClass('pov-dim pov-focus pov-center'); updateTimelineDisplay(document.getElementById('timelineRange').value); }
function openModal() { document.getElementById('manageModal').style.display = 'flex'; }
function closeModal() { document.getElementById('manageModal').style.display = 'none'; }
function deleteSelected() { let sel = cy.$(':selected'); if (sel.length === 0) return alert("삭제 대상을 클릭해주세요."); sel.remove(); saveData(); closeModal(); closeDetails(); }
function clearAll() { if(confirm('전체 데이터를 삭제하시겠습니까?')) { cy.elements().remove(); timelinePoints=['기본 설정']; localStorage.removeItem('novel_v18_data'); syncTimelineUI(); document.getElementById('timelineRange').value=1; updateTimelineDisplay(1); groupColors={}; goldenHue=Math.random(); closeModal(); } }
function downloadImage() { let png = cy.png({ full: true, bg: '#f7f6f3', scale: 2 }); let link = document.createElement('a'); link.download = `인물관계도.png`; link.href = png; link.click(); }

function saveData() {
    let data = cy.elements().map(ele => ({ group: ele.group(), data: ele.data(), position: ele.position(), classes: ele.classes().join(' ') }));
    localStorage.setItem('novel_v18_data', JSON.stringify({ elements: data, timeline: timelinePoints }));
}

window.onload = () => {
    let saved = localStorage.getItem('novel_v18_data');
    if (saved) { 
        let parsed = JSON.parse(saved);
        if(parsed.timeline) timelinePoints = parsed.timeline;
        cy.add(parsed.elements || parsed); 
    }
    syncTimelineUI(); updateTimelineDisplay(1);
    if(window.innerWidth < 768) document.getElementById('sidebar').classList.add('collapsed');
    if(cy.elements().length > 0) setTimeout(() => { cy.layout(layoutConfig).run(); }, 100);
};
cy.on('dragfree', 'node', saveData);
