/**
 * ASCII ART HEADER — mesmo layout do logo SECOND BRAIN (estilo $),
 * com vocabulário minimalista: _→-, $→#, / e \→+, | e espaço inalterados.
 */
import React from "react";
import { Box, Text } from "ink";

export function AsciiArtHeader() {
  return (
    <Box flexDirection="column" marginBottom={1} gap={0}>
      <Text bold color="cyan">███████╗ ██████╗ ██╗   ██╗███╗   ██╗██████╗ ███████╗██████╗ ███████╗    ██████╗ ██████╗  █████╗ ██╗███╗   ██╗</Text>
      <Text bold color="cyan">██╔════╝██╔═══██╗██║   ██║████╗  ██║██╔══██╗██╔════╝██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║</Text>
      <Text bold color="cyan">█████╗  ██║   ██║██║   ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝███████╗    ██████╔╝██████╔╝███████║██║██╔██╗ ██║</Text>
      <Text bold color="cyan">██╔══╝  ██║   ██║██║   ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗╚════██║    ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║</Text>
      <Text bold color="cyan">██║     ╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║███████║    ██████╔╝██║  ██║██║  ██║██║██║ ╚████║</Text>
      <Text bold color="cyan">╚═╝      ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝</Text>
    </Box>
  );
}

