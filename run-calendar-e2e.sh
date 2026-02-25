#!/bin/bash
cd /d/Code/Projetos/OpenSea/OpenSea-API
npx vitest run --config vitest.e2e.config.ts src/http/controllers/calendar/ 2>&1 | tee /d/Code/Projetos/OpenSea/OpenSea-API/calendar-e2e-output.txt
