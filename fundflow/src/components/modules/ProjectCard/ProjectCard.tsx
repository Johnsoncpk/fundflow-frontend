import { Box, Text, Image, useColorModeValue, Progress } from '@chakra-ui/react';
import { EvmNft } from '@moralisweb3/common-evm-utils';
import { FC } from 'react';
import { resolveIPFS } from 'utils/resolveIPFS';

export interface ProjectCardParams {
  key: number;
  nft: EvmNft;
}

const ProjectCard: FC<ProjectCardParams> = ({ nft: { name, metadata } }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box minHeight={"445"} maxHeight={"445px"} maxWidth="295px" bgColor={bgColor} padding={2} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
      <Box maxHeight="280px" overflow={'hidden'} borderRadius="xl">
        <Image
          src={resolveIPFS((metadata as { image?: string })?.image)}
          alt={'nft'}
          minH="280"
          minW="280"
          boxSize="100%"
          objectFit="cover"
        />
      </Box>
      <Progress margin={3} value={64} />
      <Box mt="1" fontWeight="semibold" as="h4" noOfLines={1} marginTop={2}>
        <Text align={'left'} as='b'>{name}</Text>
      </Box>
      <Text fontSize='sm' as='samp' noOfLines={[1, 2, 3]}>{resolveIPFS((metadata as { description?: string })?.description)}</Text>
      <Text align={'right'} as='i' fontSize='md' noOfLines={1}>By Jay Oliva</Text>
    </Box>
  );
};

export default ProjectCard;
