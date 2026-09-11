export function BabyCover() {
  return (
    <svg className="cover-svg" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" role="img" aria-label="鸿婴云护项目封面">
      <rect width="1200" height="720" fill="#0d0d0d" />
      <g stroke="#ffffff" opacity="0.045">
        <path d="M0 90h1200M0 180h1200M0 270h1200M0 360h1200M0 450h1200M0 540h1200M0 630h1200" />
        <path d="M120 0v720M240 0v720M360 0v720M480 0v720M600 0v720M720 0v720M840 0v720M960 0v720M1080 0v720" />
      </g>

      <g transform="translate(470 150)">
        <rect width="260" height="360" rx="22" fill="#141414" stroke="#2b2b2b" strokeWidth="1.5" />
        <rect x="22" y="28" width="216" height="240" rx="12" fill="#0a0a0a" stroke="#232323" strokeWidth="1" />
        <text x="34" y="52" fill="#565656" fontSize="11" fontFamily="JetBrains Mono, monospace" letterSpacing="2">SLE · MONITOR</text>
        <polyline
          className="wf"
          points="30,196 46,196 54,160 62,228 70,148 82,232 90,196 108,196 118,150 128,224 138,196 160,196 172,158 184,214 196,196 214,196"
          fill="none"
          stroke="#ff3b30"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="34" y="150" fill="#4a4a4a" fontSize="10" fontFamily="JetBrains Mono, monospace">HR  118  BPM</text>
        <text x="34" y="166" fill="#4a4a4a" fontSize="10" fontFamily="JetBrains Mono, monospace">HUM  46%</text>
        <text x="34" y="238" fill="#ff3b30" fontSize="10" fontFamily="JetBrains Mono, monospace">● ONLINE</text>

        <rect x="22" y="286" width="216" height="1" fill="#262626" />
        <rect x="22" y="306" width="26" height="8" rx="2" fill="#42150f" />
        <text x="56" y="314" fill="#565656" fontSize="10" fontFamily="JetBrains Mono, monospace">MQTT CONNECT</text>
        <rect x="22" y="328" width="26" height="8" rx="2" fill="#42150f" />
        <text x="56" y="336" fill="#565656" fontSize="10" fontFamily="JetBrains Mono, monospace">SMS ALARM · UART</text>
      </g>

      <g fill="none" stroke="#333333" strokeWidth="1.4">
        <path d="M330 660 L330 560 L470 560" />
        <circle cx="330" cy="660" r="4" fill="#333333" />
        <circle cx="470" cy="560" r="4" fill="#333333" />
        <path d="M870 120 L870 200 L730 200" />
        <circle cx="870" cy="120" r="4" fill="#333333" />
        <circle cx="730" cy="200" r="4" fill="#333333" />
        <path d="M870 660 L870 560 L730 560" />
        <circle cx="870" cy="660" r="4" fill="#333333" />
      </g>

      <g fill="#4a4a4a" fontSize="12" fontFamily="JetBrains Mono, monospace" textAnchor="middle" letterSpacing="3">
        <text x="600" y="700">05 · VIRTUAL HARDWARE REALIZATION</text>
        <text x="330" y="80">ICU01</text>
        <text x="890" y="692">GATEWAY</text>
      </g>
    </svg>
  );
}

export function ZhiyunCover() {
  return (
    <svg className="cover-svg" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" role="img" aria-label="智耘项目封面">
      <rect width="1200" height="720" fill="#0c0c0c" />
      <g fill="#ffffff" opacity="0.04" fontFamily="JetBrains Mono, monospace" fontSize="13">
        <text x="0" y="40">30.1</text>
        <text x="0" y="90">66.2</text>
        <text x="0" y="140">18.9</text>
        <text x="0" y="190">07.3</text>
        <text x="0" y="240">99.0</text>
      </g>
      <g stroke="#2a2a2a" strokeWidth="1.2" fill="none">
        <path d="M180 0v720M300 0v720M420 0v720M540 0v720M660 0v720M780 0v720M900 0v720M1020 0v720" />
      </g>

      <g transform="translate(420 150)">
        <rect width="300" height="380" rx="18" fill="#141414" stroke="#2b2b2b" strokeWidth="1.5" />
        <rect x="18" y="26" width="264" height="150" rx="10" fill="#0a0a0a" stroke="#232323" />
        <text x="32" y="52" fill="#565656" fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="2">STM32F1 · WS63</text>
        <text x="32" y="84" fill="#ff3b30" fontSize="22" fontFamily="JetBrains Mono, monospace" fontWeight="600">26.4°</text>
        <text x="32" y="104" fill="#4a4a4a" fontSize="10" fontFamily="JetBrains Mono, monospace">TEMP</text>
        <text x="150" y="84" fill="#f5f5f7" fontSize="22" fontFamily="JetBrains Mono, monospace" fontWeight="600">57%</text>
        <text x="150" y="104" fill="#4a4a4a" fontSize="10" fontFamily="JetBrains Mono, monospace">HUM</text>
        <text x="32" y="138" fill="#4a4a4a" fontSize="9" fontFamily="JetBrains Mono, monospace">SOIL <tspan fill="#ff3b30">42</tspan> · LIGHT <tspan fill="#ff3b30">980</tspan></text>

        <rect x="18" y="196" width="264" height="1" fill="#262626" />
        <rect x="18" y="214" width="264" height="30" rx="8" fill="#1a1212" stroke="#521e18" />
        <circle cx="38" cy="229" r="5" fill="#ff3b30" />
        <text x="54" y="233" fill="#ff3b30" fontSize="10" fontFamily="JetBrains Mono, monospace">PUMP</text>
        <rect x="18" y="254" width="264" height="30" rx="8" fill="#141414" stroke="#232323" />
        <circle cx="38" cy="269" r="5" fill="#565656" />
        <text x="54" y="273" fill="#565656" fontSize="10" fontFamily="JetBrains Mono, monospace">SPRAY</text>
        <rect x="18" y="294" width="264" height="30" rx="8" fill="#141414" stroke="#232323" />
        <circle cx="38" cy="309" r="5" fill="#565656" />
        <text x="54" y="313" fill="#565656" fontSize="10" fontFamily="JetBrains Mono, monospace">FAN</text>

        <text x="32" y="356" fill="#ff3b30" fontSize="10" fontFamily="JetBrains Mono, monospace">● BLE LINK · JSON TX</text>
      </g>

      <g fill="#4a4a4a" fontSize="12" fontFamily="JetBrains Mono, monospace" textAnchor="middle" letterSpacing="3">
        <text x="600" y="45">// SMART AGRICULTURE NODE v2.0</text>
        <text x="600" y="692">DHT11 · ADC · OLED · RELAY · BLE</text>
      </g>
      <g fill="none" stroke="#333333" strokeWidth="1.3">
        <circle cx="960" cy="180" r="5" fill="#333333" />
        <circle cx="960" cy="240" r="5" fill="#333333" />
        <circle cx="960" cy="300" r="5" fill="#333333" />
        <path d="M960 185 L1060 260 L960 235 L1060 310 L960 305" fill="none" />
      </g>
    </svg>
  );
}

export function GenericCover({ project }) {
  const initials = (project.name || project.id || 'NEW').slice(0, 2).toUpperCase();
  return (
    <svg className="cover-svg" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${project.name}项目封面`}>
      <rect width="1200" height="720" fill="#0d0d0d" />
      <g stroke="#292929" strokeWidth="1" fill="none">
        <path d="M0 90h1200M0 180h1200M0 270h1200M0 360h1200M0 450h1200M0 540h1200M0 630h1200" />
        <path d="M120 0v720M240 0v720M360 0v720M480 0v720M600 0v720M720 0v720M840 0v720M960 0v720M1080 0v720" />
      </g>
      <rect x="340" y="180" width="520" height="360" rx="24" fill="#131313" stroke="#303030" strokeWidth="1.5" />
      <text x="600" y="330" textAnchor="middle" fill="#ff3b30" fontSize="120" fontFamily="JetBrains Mono, monospace" fontWeight="700">
        {initials}
      </text>
      <text x="600" y="410" textAnchor="middle" fill="#f5f5f7" fontSize="36" fontFamily="Inter, sans-serif">
        {project.name}
      </text>
      <text x="600" y="450" textAnchor="middle" fill="#666666" fontSize="16" fontFamily="JetBrains Mono, monospace" letterSpacing="3">
        PROJECT · {project.index || ''}
      </text>
    </svg>
  );
}
