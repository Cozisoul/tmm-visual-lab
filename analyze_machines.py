import re

with open('sketches/machines.ts', 'r') as f:
    content = f.read()

# All machines
machines = [
    'modular-gridder', 'geometric-circles', 'truchet-tiler', 'maze-generator', 'moire-interference',
    'layout-engine', 'recursive-partition', 'bauhaus-constructor', 'poster-architect', 'isometric-city',
    'glyph-swarm', 'type-stacker', 'kinetic-scroller', 'liquid-data-type', 'signal-break', 'webcam-ascii',
    'signal-oscillator', 'audio-reactor', 'flow-field', 'particle-analyzer', 'spectrogram-history', 'sonic-terrain',
    'blob-generator', 'charcoal-animator', 'raymarch-sdf', 'raymarch-construct', 'slit-scan', 'motion-heatmap',
    'edge-glitch', 'kaleido-cam', 'poor-image', 'pixel-sorter', 'halftone-raster', 'dither-field',
    'reaction-diffusion', 'voronoi-systems', 'latent-fluidity', 'quantum-strobe', 'lidar-scan',
    'atmospheric-sun', 'mirror-box', 'organic-lattice', 'industrial-brutalism', 'soil-strata',
    'woven-path', 'robotic-mimicry', 'voice-print'
]

# First, extract all machine definitions with their names
name_map = {}
for match in re.finditer(r"id:\s*['\"]([^'\"]+)['\"],\s*name:\s*['\"]([^'\"]+)['\"]", content):
    name_map[match.group(1)] = match.group(2)

no_audio = []

# Find each machine and check for audio
for m_id in machines:
    # Find the machine definition
    pattern = r"(const|export const)\s+\w+:\s*Machine\s*=\s*\{\s*id:\s*['\"]" + re.escape(m_id) + r"['\"]"
    match = re.search(pattern, content)
    
    if match:
        start_pos = match.start()
        line_num = content[:start_pos].count('\n') + 1
        
        # Find the draw function for this machine
        draw_pattern = r"draw:\s*\([^)]*\)\s*=>\s*\{(.*?)^\s*\};"
        
        # Search forward from the machine ID
        search_from = match.end()
        remaining = content[search_from:]
        
        # Find next machine definition to know where this one ends
        next_machine = re.search(r"^(const|export const)\s+\w+:\s*Machine\s*=", remaining, re.MULTILINE)
        if next_machine:
            machine_block = remaining[:next_machine.start()]
        else:
            # Last machine
            machine_block = remaining
        
        # Check if this machine block contains audio references
        if 'globalState?.audio' not in machine_block:
            name = name_map.get(m_id, 'Unknown')
            no_audio.append((line_num, m_id, name))

# Print results
print('MACHINES WITHOUT AUDIO REFERENCES:')
print('=' * 80)
for line_num, m_id, name in sorted(no_audio):
    print(f'LINE: {line_num} - ID: {m_id} - NAME: {name}')

print(f'\nTotal: {len(no_audio)} machines without audio references')
