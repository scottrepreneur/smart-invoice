import {
  Divider,
  Flex,
  Link,
  Spacer,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { utils } from 'ethers';
import React, { useContext } from 'react';

import { CreateContext } from '../../context/CreateContext';
import { Web3Context } from '../../context/Web3Context';
import { AccountLink } from '../../shared/AccountLink';
import { getDateString, getTokenInfo } from '../../utils/helpers';

export function FormConfirmation({ display, tokenData }) {
  const { chainId } = useContext(Web3Context);
  const {
    projectName,
    projectDescription,
    projectAgreement,
    clientAddress,
    paymentAddress,
    startDate,
    endDate,
    deadline,
    lateFee,
    lateFeeInterval,
    paymentDue,
    paymentToken,
  } = useContext(CreateContext);

  const { decimals, symbol } = getTokenInfo(chainId, paymentToken, tokenData);

  const flexWidth = useBreakpointValue({
    base: '95%',
    sm: '95%',
    md: '80%',
    lg: '70%',
  });

  return (
    <VStack w="100%" spacing="1rem" color="#323C47" display={display}>
      <Text
        id="project-title"
        color="#323C47"
        fontWeight="bold"
        fontSize="xl"
        align="center"
      >
        {projectName}
      </Text>
      {projectDescription && <Text align="center">{projectDescription}</Text>}
      <Link
        href={projectAgreement.src}
        isExternal
        mb="1rem"
        textDecor="underline"
      >
        {projectAgreement.src}
      </Link>
      <Divider />
      <Flex justify="space-between" width={flexWidth}>
        <Text>{`Client Address: `}</Text>
        <Spacer />
        <AccountLink address={clientAddress} />
      </Flex>
      <Flex justify="space-between" width={flexWidth}>
        <Text>{`Payment Address: `}</Text>
        <AccountLink address={paymentAddress} />
      </Flex>
      {startDate && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Project Start Date: `}</Text>
          <Text textAlign="right">{getDateString(startDate / 1000)}</Text>
        </Flex>
      )}
      {endDate && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Expected End Date: `}</Text>
          <Text textAlign="right">{getDateString(endDate / 1000)}</Text>
        </Flex>
      )}
      {deadline && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Payment Deadline: `}</Text>
          <Text textAlign="right">{getDateString(deadline / 1000)}</Text>
        </Flex>
      )}
      {lateFee && lateFeeInterval && (
        <Flex justify="space-between" width={flexWidth}>
          <Text>{`Late Fee: `}</Text>
          <Text textAlign="right">
            {`${utils.formatUnits(lateFee, decimals)} ${symbol} 
              every ${lateFeeInterval / (1000 * 60 * 60 * 24)} 
              day${lateFeeInterval / (1000 * 60 * 60 * 24) > 1 && 's'}`}
          </Text>
        </Flex>
      )}
      <Divider
        color="black"
        w="calc(100% + 2rem)"
        transform="translateX(-1rem)"
      />
      <Flex justify="flex-end">
        <Text color="blue.1" ml="2.5rem" fontWeight="bold">
          {`${utils.formatUnits(paymentDue, decimals)} ${symbol} Total`}
        </Text>
      </Flex>
    </VStack>
  );
}
