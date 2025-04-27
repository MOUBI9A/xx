#!/bin/bash

# Game Hub SPA Manager Script with Terminal Animations
# Created: April 26, 2025

# ANSI Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
RESET='\033[0m'

# Spinner Animation Variables
SPINNER_FRAMES=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
SPINNER_LENGTH=${#SPINNER_FRAMES[@]}

# Game Hub ASCII Art
display_header() {
  clear
  echo -e "${CYAN}"
  echo "   _____ ______  ___  ___ _____   _   _ _   _ ______ "
  echo "  |  __ \| ___ \/ _ \ |  \/  ||  _  | | | | || ___ \\"
  echo "  | |  \/| |_/ / /_\ \| .  . || | | | | | | || |_/ /"
  echo "  | | __ |    /|  _  || |\/| || | | | | | | ||  __/ "
  echo "  | |_\ \| |\ \| | | || |  | || |/ / | |_| | | |    "
  echo "   \____/\_| \_\_| |_/\_|  |_/|___/   \___/  \_|    "
  echo -e "${RESET}"
  echo -e "${YELLOW}=======================================${RESET}"
  echo -e "${GREEN}        Interactive Manager CLI         ${RESET}"
  echo -e "${YELLOW}=======================================${RESET}"
  echo ""
}

# Spinner Animation
display_spinner() {
  local pid=$1
  local message=$2
  local i=0
  
  while kill -0 $pid 2>/dev/null; do
    printf "\r${YELLOW}[${SPINNER_FRAMES[$i]}]${RESET} ${message}"
    i=$(( (i + 1) % SPINNER_LENGTH ))
    sleep 0.1
  done
  printf "\r${GREEN}[✓]${RESET} ${message} - Done!       \n"
}

# Progress Bar Animation
display_progress() {
  local message=$1
  local duration=$2
  local width=50
  local bar_char="▓"
  local empty_char="░"
  
  echo -e "\n${message}"
  
  for i in $(seq 1 $width); do
    local percentage=$((i * 100 / width))
    local num_bars=$i
    local num_spaces=$((width - num_bars))
    local bar=$(printf "%${num_bars}s" | tr ' ' "$bar_char")
    local space=$(printf "%${num_spaces}s" | tr ' ' "$empty_char")
    
    printf "\r${BLUE}[${bar}${space}]${RESET} ${percentage}%% "
    sleep $(echo "$duration/$width" | bc -l)
  done
  echo -e "\n${GREEN}[✓] Complete!${RESET}\n"
}

# Function to check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running or not installed${RESET}"
    echo -e "${YELLOW}Please start Docker Desktop or install Docker first${RESET}"
    exit 1
  fi
}

# Function to start the application
start_app() {
  display_header
  echo -e "${CYAN}Starting Game Hub SPA...${RESET}\n"
  
  check_docker

  echo -e "${YELLOW}Building and starting Docker containers...${RESET}"
  docker compose up --build -d > /dev/null 2>&1 &
  display_spinner $! "Building and starting services"
  
  sleep 1
  
  echo -e "\n${GREEN}Verifying services...${RESET}"
  if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓${RESET} All services are up and running"
    echo -e "${GREEN}✓${RESET} Application available at ${CYAN}http://localhost:3000${RESET}"
    
    # Animated success message
    display_progress "Loading game assets" 1.5
    
    echo -e "${PURPLE}=================================================${RESET}"
    echo -e "  ${GREEN}Game Hub SPA is now ready!${RESET}"
    echo -e "  ${WHITE}Access it in your browser at:${RESET} ${CYAN}http://localhost:3000${RESET}"
    echo -e "${PURPLE}=================================================${RESET}"
    
  else
    echo -e "${RED}✗ Some services failed to start. Check logs with:${RESET}"
    echo -e "  ${YELLOW}docker compose logs${RESET}"
  fi
}

# Function to stop the application
stop_app() {
  display_header
  echo -e "${CYAN}Stopping Game Hub SPA...${RESET}\n"
  
  check_docker
  
  echo -e "${YELLOW}Stopping Docker containers...${RESET}"
  docker compose stop > /dev/null 2>&1 &
  display_spinner $! "Stopping services"
  
  echo -e "\n${GREEN}Game Hub SPA has been stopped${RESET}"
}

# Function to clean up resources
clean_app() {
  display_header
  echo -e "${CYAN}Cleaning up Game Hub SPA...${RESET}\n"
  
  check_docker
  
  echo -e "${YELLOW}Removing Docker containers...${RESET}"
  docker compose down > /dev/null 2>&1 &
  display_spinner $! "Removing containers"
  
  echo -e "\n${YELLOW}Removing node_modules and temporary files...${RESET}"
  (find . -name "node_modules" -type d -prune -exec rm -rf '{}' + 2>/dev/null) &
  display_spinner $! "Removing node_modules"
  
  echo -e "\n${YELLOW}Cleaning Docker cache...${RESET}"
  docker system prune -f > /dev/null 2>&1 &
  display_spinner $! "Cleaning Docker cache"
  
  echo -e "\n${GREEN}✓ Clean up complete!${RESET}"
  
  # Animated completion bar
  display_progress "Finalizing cleanup process" 1.0
}

# Function to rebuild and restart the application
rebuild_app() {
  display_header
  echo -e "${CYAN}Rebuilding Game Hub SPA...${RESET}\n"
  
  check_docker
  
  echo -e "${YELLOW}Stopping existing containers...${RESET}"
  docker compose down > /dev/null 2>&1 &
  display_spinner $! "Stopping existing containers"
  
  echo -e "\n${YELLOW}Rebuilding containers from scratch...${RESET}"
  docker compose build --no-cache > /dev/null 2>&1 &
  display_spinner $! "Rebuilding containers"
  
  echo -e "\n${YELLOW}Starting fresh containers...${RESET}"
  docker compose up -d > /dev/null 2>&1 &
  display_spinner $! "Starting fresh containers"
  
  echo -e "\n${GREEN}✓ Rebuild complete!${RESET}"
  echo -e "${GREEN}✓${RESET} Application available at ${CYAN}http://localhost:3000${RESET}"
  
  # Animated completion
  display_progress "Reloading game assets" 1.0
}

# Function to display Docker logs with live updates
show_logs() {
  display_header
  echo -e "${CYAN}Showing live logs (press Ctrl+C to exit)...${RESET}\n"
  
  check_docker
  
  echo -e "${YELLOW}Fetching logs from containers...${RESET}\n"
  sleep 1
  
  # Animated transition
  for i in {1..3}; do
    echo -ne "${YELLOW}.${RESET}"
    sleep 0.3
  done
  echo -e "\n"
  
  docker compose logs -f
}

# Show help
show_help() {
  display_header
  echo -e "${CYAN}Available Commands:${RESET}"
  echo -e "  ${GREEN}start${RESET}    - Start Game Hub SPA"
  echo -e "  ${YELLOW}stop${RESET}     - Stop Game Hub SPA"
  echo -e "  ${RED}clean${RESET}    - Clean up Docker containers and node_modules"
  echo -e "  ${BLUE}rebuild${RESET}  - Rebuild and restart the application"
  echo -e "  ${PURPLE}logs${RESET}     - Show live Docker logs"
  echo -e "  ${CYAN}help${RESET}     - Show this help menu"
  echo ""
  echo -e "${YELLOW}Example:${RESET}"
  echo -e "  ./gamehub-cli.sh start"
}

# Check if a command is provided
if [ $# -eq 0 ]; then
  # No command provided, show menu
  display_header
  
  echo -e "${CYAN}Welcome to Game Hub SPA Manager!${RESET}\n"
  echo -e "Please select an option:"
  echo -e "  ${WHITE}1.${RESET} ${GREEN}Start${RESET} Game Hub SPA"
  echo -e "  ${WHITE}2.${RESET} ${YELLOW}Stop${RESET} Game Hub SPA"
  echo -e "  ${WHITE}3.${RESET} ${RED}Clean${RESET} up resources"
  echo -e "  ${WHITE}4.${RESET} ${BLUE}Rebuild${RESET} application"
  echo -e "  ${WHITE}5.${RESET} Show ${PURPLE}logs${RESET}"
  echo -e "  ${WHITE}q.${RESET} Exit"
  
  echo ""
  read -p "Enter your choice: " choice
  
  case $choice in
    1) start_app ;;
    2) stop_app ;;
    3) clean_app ;;
    4) rebuild_app ;;
    5) show_logs ;;
    q) exit 0 ;;
    *) echo -e "\n${RED}Invalid option!${RESET}" && exit 1 ;;
  esac
else
  # Command provided as argument
  case $1 in
    start) start_app ;;
    stop) stop_app ;;
    clean) clean_app ;;
    rebuild) rebuild_app ;;
    logs) show_logs ;;
    help) show_help ;;
    *) echo -e "${RED}Invalid command: $1${RESET}" && show_help && exit 1 ;;
  esac
fi